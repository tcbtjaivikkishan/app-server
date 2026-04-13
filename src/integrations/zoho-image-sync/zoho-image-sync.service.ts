import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ZohoHttpService } from '../../zoho/core/zoho-http.service';
import { ZohoAuthService } from '../../zoho/core/zoho-auth.service';
import { S3UploadService } from '../../common/s3-upload.service';
import { ConfigService } from '@nestjs/config';
import { Product } from '../../modules/products/schemas/product.schema';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

@Injectable()
export class ZohoImageSyncService {
  private readonly logger = new Logger(ZohoImageSyncService.name);

  constructor(
    private readonly zohoHttpService: ZohoHttpService,
    private readonly zohoAuthService: ZohoAuthService,
    private readonly s3UploadService: S3UploadService,
    private readonly configService: ConfigService,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  // ✅ Hard delete from MongoDB + S3
  async deleteItem(itemId: string): Promise<void> {
    this.logger.log(`🗑️ Deleting item: ${itemId}`);

    const product = await this.productModel.findOne({ zoho_item_id: itemId });

    if (!product) {
      this.logger.warn(`⚠️ Item ${itemId} not found in DB — nothing to delete`);
      return;
    }

    // Delete image from S3 if exists
    if (product.image_s3_key) {
      await this.s3UploadService.deleteImage(product.image_s3_key);
    }

    // Hard delete from MongoDB
    try {
      await this.productModel.deleteOne({ zoho_item_id: itemId });
      this.logger.log(`✅ Item ${itemId} deleted from DB and S3`);
    } catch (err: any) {
      this.logger.error(`❌ MongoDB delete failed for ${itemId}: ${err.message}`);
      throw err;
    }
  }

  // ✅ Retry wrapper
  private async withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const isRateLimit =
          err?.message?.includes('429') || err?.message?.includes('rate');
        const isTimeout =
          err?.message?.includes('timeout') ||
          err?.message?.includes('ECONNRESET');

        if ((isRateLimit || isTimeout) && attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * attempt;
          this.logger.warn(
            `⏳ ${label} failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms...`,
          );
          await new Promise((res) => setTimeout(res, delay));
        } else {
          break;
        }
      }
    }

    throw lastError;
  }

  // ✅ Main sync
  async syncItemImage(itemId: string): Promise<void> {
    this.logger.log(`🔄 Syncing item: ${itemId}`);

    const orgId = this.configService.getOrThrow('ZOHO_ORG_ID');

    // Step 1: Fetch full item from Zoho
    const data = await this.withRetry(
      () =>
        this.zohoHttpService.request(
          'GET',
          `https://www.zohoapis.in/inventory/v1/items/${itemId}?organization_id=${orgId}`,
          'inventory',
        ),
      'Fetch item',
    );

    const item = data?.item;
    if (!item) {
      this.logger.warn(`⚠️ Item ${itemId} not found in Zoho`);
      return;
    }

    this.logger.log(
      `📦 Item: ${item.name} | image: ${item.image_name} | status: ${item.status}`,
    );

    // ✅ Item inactive in Zoho → reflect instantly
    if (item.status !== 'active') {
      this.logger.warn(`⚠️ Item ${itemId} is ${item.status} — marking inactive`);
      try {
        await this.productModel.findOneAndUpdate(
          { zoho_item_id: String(itemId) },
          { is_active: false, show_in_storefront: false },
          { upsert: false },
        );
        this.logger.log(`✅ Item ${itemId} marked inactive`);
      } catch (err: any) {
        this.logger.error(`❌ MongoDB update failed for ${itemId}: ${err.message}`);
        throw err;
      }
      return;
    }

    // Step 2: Find existing product in MongoDB
    const existingProduct = await this.productModel.findOne({
      zoho_item_id: String(itemId),
    });

    const isNewProduct = !existingProduct;
    this.logger.log(isNewProduct ? `🆕 New product` : `🔁 Existing product`);

    // Step 3: Build product data payload
    const productData: any = {
      zoho_item_id: String(itemId),
      name: item.name || '',
      description: item.description || '',
      sku: item.sku || '',
      price: item.rate || 0,
      stock: item.actual_available_stock ?? item.stock_on_hand ?? 0,
      track_inventory: item.track_inventory ?? true,
      category_id: item.category_id || '',
      category_name: item.category_name || '',
      weight: item.weight || 0,
      length: item.length || 0,
      width: item.width || 0,
      height: item.height || 0,
      is_active: item.status === 'active',
      // ✅ Hide from storefront if out of stock
      show_in_storefront:
        item.status === 'active' &&
        (item.actual_available_stock ?? item.stock_on_hand ?? 0) > 0,
    };

    const imageName = item?.image_name;

    // ✅ Image removed in Zoho → delete from S3 + clear DB
    if (!imageName && (existingProduct?.image_url || existingProduct?.image_s3_key)) {
      this.logger.warn(
        `🗑️ Image removed in Zoho for item ${itemId} — deleting from S3 and clearing DB`,
      );

      if (existingProduct.image_s3_key) {
        await this.s3UploadService.deleteImage(existingProduct.image_s3_key);
      }

      try {
        await this.productModel.findOneAndUpdate(
          { zoho_item_id: String(itemId) },
          {
            ...productData,
            image_url: null,
            image_s3_key: null,
            image_hash: null,
            image_name: null,
            image_last_synced_at: new Date(),
          },
          { upsert: true, returnDocument: 'after' },
        );
        this.logger.log(`✅ Product updated, image cleared for item ${itemId}`);
      } catch (err: any) {
        this.logger.error(`❌ MongoDB update failed for ${itemId}: ${err.message}`);
        throw err;
      }
      return;
    }

    // ✅ No image at all → save product details only
    if (!imageName) {
      this.logger.warn(`⚠️ No image for item ${itemId} — saving product without image`);

      try {
        await this.productModel.findOneAndUpdate(
          { zoho_item_id: String(itemId) },
          productData,
          { upsert: true, returnDocument: 'after' },
        );
        this.logger.log(`✅ Product saved (no image) for item ${itemId}`);
      } catch (err: any) {
        this.logger.error(`❌ MongoDB save failed for ${itemId}: ${err.message}`);
        throw err;
      }
      return;
    }

    // Step 4: Detect image change
    const imageNameChanged = existingProduct?.image_name !== imageName;

    if (isNewProduct) {
      this.logger.log(`🖼️ New product — uploading image`);
    } else if (imageNameChanged) {
      this.logger.log(
        `🖼️ Image changed (${existingProduct?.image_name} → ${imageName})`,
      );
    } else {
      this.logger.log(`🔍 Same image name — verifying via hash`);
    }

    // Step 5: Download + upload to S3
    const imageUrl = `https://www.zohoapis.in/inventory/v1/items/${itemId}/image?organization_id=${orgId}`;
    const token = await this.zohoAuthService.getValidAccessToken('inventory');

    let uploadResult: {
      s3Url: string;
      s3Key: string;
      imageHash: string;
      skipped: boolean;
    };

    try {
      uploadResult = await this.withRetry(
        () =>
          this.s3UploadService.uploadImageFromUrl(
            imageUrl,
            itemId,
            token,
            imageNameChanged || isNewProduct
              ? undefined
              : existingProduct?.image_hash,
          ),
        'S3 upload',
      );
    } catch (err: any) {
      // ✅ S3 failed → still save product details
      this.logger.error(
        `❌ S3 upload failed for ${itemId}: ${err.message} — saving product details only`,
      );

      try {
        await this.productModel.findOneAndUpdate(
          { zoho_item_id: String(itemId) },
          productData,
          { upsert: true, returnDocument: 'after' },
        );
        this.logger.log(`✅ Product details saved (S3 failed) for ${itemId}`);
      } catch (dbErr: any) {
        this.logger.error(`❌ MongoDB save also failed for ${itemId}: ${dbErr.message}`);
        throw dbErr;
      }
      return;
    }

    const { s3Url, s3Key, imageHash, skipped } = uploadResult;

    // ✅ Image hash unchanged → update product details only
    if (skipped) {
      this.logger.log(`⏭️ Image unchanged — updating product details only`);

      try {
        await this.productModel.findOneAndUpdate(
          { zoho_item_id: String(itemId) },
          productData,
          { upsert: true, returnDocument: 'after' },
        );
        this.logger.log(`✅ Product details updated (image skipped) for ${itemId}`);
      } catch (err: any) {
        this.logger.error(`❌ MongoDB update failed for ${itemId}: ${err.message}`);
        throw err;
      }
      return;
    }

    // ✅ Image name changed → delete old S3 file first
    if (imageNameChanged && existingProduct?.image_s3_key) {
      await this.s3UploadService.deleteImage(existingProduct.image_s3_key);
    }

    // Step 6: Save everything to DB
    try {
      await this.productModel.findOneAndUpdate(
        { zoho_item_id: String(itemId) },
        {
          ...productData,
          image_url: s3Url,
          image_s3_key: s3Key,
          image_hash: imageHash,
          image_name: imageName,
          image_last_synced_at: new Date(),
        },
        { upsert: true, returnDocument: 'after' },
      );

      this.logger.log(
        `✅ ${isNewProduct ? 'Created' : 'Updated'} product + image for ${itemId} → ${s3Url}`,
      );
    } catch (err: any) {
      this.logger.error(`❌ MongoDB save failed for ${itemId}: ${err.message}`);
      throw err;
    }
  }
}