import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../../modules/products/schemas/product.schema';
import { ZohoInventoryService } from '../../zoho/inventory/inventory.service';
import { S3UploadService } from '../../common/s3-upload.service';

const MAX_RETRIES = 3;

@Injectable()
export class ZohoImageSyncService {
  private readonly logger = new Logger(ZohoImageSyncService.name);

  constructor(
    @InjectModel(Product.name)
    private productModel: Model<Product>,
    private zohoInventoryService: ZohoInventoryService,
    private readonly s3UploadService: S3UploadService
  ) { }

  // =========================
  // 🔁 MAIN SYNC FUNCTION (UNCHANGED FLOW)
  // =========================
  async syncItemImage(itemId: string) {
    return this.withRetry(async () => {
      const item = await this.zohoInventoryService.getItem(itemId);

      if (!item) {
        this.logger.warn(`❌ Item not found: ${itemId}`);
        return;
      }

      this.logger.log(`PACKAGE DETAILS: ${JSON.stringify(item.package_details)}`);
      const pkg = item.package_details || {};

      await this.productModel.updateOne(
        { zoho_item_id: item.item_id },
        {
          $set: {
            name: item.name,
            description: item.description || '',
            sku: item.sku,
            category_id: item.category_id,
            category_name: item.category_name,

            price: Number(item.rate),
            stock: Number(item.available_stock || 0),

            track_inventory: item.track_inventory,
            show_in_storefront: item.show_in_storefront ?? true,

            // ✅ FIXED WEIGHT
            weight: pkg.weight !== undefined ? Number(pkg.weight) : 0,
            weight_unit: pkg.weight_unit || 'kg',

            // ✅ FIXED DIMENSIONS
            dimensions:
              pkg.length && pkg.width && pkg.height
                ? `${pkg.length} cm x ${pkg.width} cm x ${pkg.height} cm`
                : '',

            zoho_image_document_id: item.image_document_id,
          },
        },
        { upsert: true },
      );

      // =========================
      // 🖼️ IMAGE SYNC (SCHEMA FIXED)
      // =========================

      const existing = await this.productModel.findOne({
        zoho_item_id: item.item_id,
      });

      if (
        existing?.image?.image_name === item.image_name &&
        existing?.image?.image_hash
      ) {
        this.logger.log(`🟡 Image unchanged: ${item.item_id}`);
        return;
      }

      const payload = await this.zohoInventoryService.getItemImageUploadPayload(
        item.item_id,
        existing?.image?.image_hash,
      );

      const upload = await this.s3UploadService.uploadImageFromUrl(
        payload.imageUrl,
        payload.itemId,
        payload.zohoToken,
        payload.existingHash,
      );

      // ❗ If skipped → do nothing
      if (upload.skipped) {
        this.logger.log(`🟡 Image unchanged: ${item.item_id}`);
        return;
      }

      // ✅ SAVE ONLY NESTED IMAGE
      await this.productModel.updateOne(
        { zoho_item_id: item.item_id },
        {
          $set: {
            image: {
              image_key: upload.s3Key,
              image_url: upload.s3Url,
              image_hash: upload.imageHash,
              image_last_synced_at: new Date(),
              image_name: item.image_name,
              image_s3_key: upload.s3Key,
            },
          },

          // ❗ REMOVE OLD FIELDS
          $unset: {
            image_url: "",
            image_s3_key: "",
            image_hash: "",
            image_name: "",
            image_key: "",
            image_last_synced_at: "",
          },
        },
      );

      this.logger.log(`✅ Synced: ${item.item_id}`);
    }, 'syncItemImage');
  }

  // =========================
  // 🗑️ DELETE (UNCHANGED LOGIC + FIXED ACCESS)
  // =========================
  async deleteItem(itemId: string) {
    const product = await this.productModel.findOne({
      zoho_item_id: itemId,
    });

    if (!product) return;

    // ✅ FIX: nested access
    if (product.image?.image_s3_key) {
      this.logger.log(`🗑️ Removing image for ${itemId}`);
      // call your delete from S3 here if needed
    }

    await this.productModel.updateOne(
      { zoho_item_id: itemId },
      { $set: { is_active: false } },
    );

    this.logger.log(`🗑️ Product deleted: ${itemId}`);
  }

  // =========================
  // 🔁 RETRY (UNCHANGED)
  // =========================
  private async withRetry<T>(
    fn: () => Promise<T>,
    label: string,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        this.logger.warn(
          `⚠️ ${label} failed (attempt ${attempt}): ${error.message}`,
        );
      }
    }

    this.logger.error(`❌ ${label} failed after retries`);
    throw lastError;
  }
}