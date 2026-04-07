/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Readable } from 'stream';
import { createHash } from 'crypto';
import { Product, ProductDocument } from './schemas/product.schema';
import { ZohoService } from '../zoho/zoho.service';
import { S3Service } from '../upload/s3.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    private readonly zohoService: ZohoService,
    private readonly s3Service: S3Service,
  ) {}

  async getPaginatedProducts(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.productModel.find().skip(skip).limit(limit).lean(),
      this.productModel.countDocuments(),
    ]);
    return { products, total, page, limit };
  }

  async syncProductImage(
    productId: string,
    zohoItemId: string,
  ): Promise<string | null> {
    // Step 1: fetch image buffer from Zoho
    const imageBuffer = await this.zohoService.getItemImage(zohoItemId);

    if (!imageBuffer) {
      console.warn(`No image returned from Zoho for item: ${zohoItemId}`);
      return null;
    }

    // Step 2: build a valid Multer file object from the buffer
    const readableStream = new Readable();
    readableStream.push(imageBuffer);
    readableStream.push(null);

    const file: Express.Multer.File = {
      buffer: imageBuffer,
      originalname: `${zohoItemId}.jpg`,
      mimetype: 'image/jpeg',
      size: imageBuffer.length,
      fieldname: 'image',
      encoding: '7bit',
      destination: '',
      filename: '',
      path: '',
      stream: readableStream,
    };

    // Step 3: upload to S3
    const uploaded = await this.s3Service.uploadFile(file, 'products');

    // Step 4: save image_url and image_key in MongoDB
    await this.productModel.findByIdAndUpdate(productId, {
      image_url: uploaded.url,
      image_key: uploaded.key,
    });

    console.log(`Image synced for product ${productId}: ${uploaded.url}`);
    return uploaded.url;
  }

  async syncAllProductImages(): Promise<{
    success: number;
    failed: number;
    skipped: number;
    total: number;
  }> {
    const products = await this.productModel
      .find({ zoho_item_id: { $exists: true, $ne: '' } })
      .lean();

    let success = 0,
      failed = 0,
      skipped = 0;
    const total = products.length;

    console.log(`Starting bulk image sync for ${total} products...`);

    for (const product of products) {
      if (product.image_url && product.image_url !== '') {
        console.log(`Skipping product ${product._id} — already has image`);
        skipped++;
        continue;
      }

      try {
        const result = await this.syncProductImage(
          (product._id as any).toString(),
          product.zoho_item_id,
        );

        if (result) success++;
        else skipped++;
      } catch (err: any) {
        console.error(`Failed to sync product ${product._id}:`, err.message);
        failed++;
      }

      await new Promise((res) => setTimeout(res, 300));
    }

    console.log(
      `Bulk sync complete — total: ${total}, success: ${success}, failed: ${failed}, skipped: ${skipped}`,
    );

    return { success, failed, skipped, total };
  }

  // Called automatically when Zoho sends a webhook for item
  // create or update events. Since products are already stored
  // in MongoDB, this only syncs the image to S3 if it changed.
  async handleZohoWebhook(payload: any): Promise<void> {
    const zohoItemId = payload?.item_id?.toString();

    if (!zohoItemId) {
      console.warn('Zoho webhook received but no item_id found in payload');
      return;
    }

    console.log(`Zoho webhook: processing item ${zohoItemId}...`);

    try {
      // Step 1: find existing product in MongoDB
      const product = await this.productModel.findOne({
        zoho_item_id: zohoItemId,
      });

      if (!product) {
        console.warn(
          `No MongoDB product found for Zoho item ${zohoItemId}, skipping`,
        );
        return;
      }

      // Step 2: fetch latest image buffer from Zoho
      const imageBuffer = await this.zohoService.getItemImage(zohoItemId);

      if (!imageBuffer) {
        console.warn(`No image found in Zoho for item ${zohoItemId}, skipping`);
        return;
      }

      // Step 3: compare SHA-256 hash to avoid unnecessary re-upload
      const newHash = createHash('sha256').update(imageBuffer).digest('hex');

      if (product.image_hash && product.image_hash === newHash) {
        console.log(
          `Image unchanged for product ${product._id}, skipping S3 upload`,
        );
        return;
      }

      // Step 4: delete old S3 image if it exists
      if (product.image_key) {
        await this.s3Service.deleteFile(product.image_key);
        console.log(`Deleted old S3 image: ${product.image_key}`);
      }

      // Step 5: upload new image to S3
      const key = `products/${zohoItemId}.jpg`;
      const { url } = await this.s3Service.uploadBuffer(
        imageBuffer,
        key,
        'image/jpeg',
      );

      // Step 6: update MongoDB image fields
      await this.productModel.findByIdAndUpdate(product._id, {
        image_url: url,
        image_key: key,
        image_hash: newHash,
      });

      console.log(`Image synced to S3 for product ${product._id} → ${url}`);
    } catch (err: any) {
      console.error(`Webhook failed for item ${zohoItemId}:`, err.message);
    }
  }
}