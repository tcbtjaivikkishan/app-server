import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);
  private s3: S3Client;
  private bucket: string;
  private region: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow('AWS_S3_BUCKET_NAME');
    this.region = this.configService.getOrThrow('AWS_REGION');

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadImageFromUrl(
    imageUrl: string,
    itemId: string,
    zohoToken?: string,
    existingHash?: string,
  ): Promise<{ s3Url: string; s3Key: string; imageHash: string; skipped: boolean }> {

    this.logger.log(`⬇️ Downloading: ${imageUrl}`);

    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: zohoToken
        ? { Authorization: `Zoho-oauthtoken ${zohoToken}` }
        : {},
      maxContentLength: MAX_IMAGE_SIZE_BYTES,
      maxBodyLength: MAX_IMAGE_SIZE_BYTES,
    });

    const buffer = Buffer.from(response.data);

    // ✅ Reject oversized images
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(
        `Image too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds ${MAX_IMAGE_SIZE_MB}MB limit`,
      );
    }

    const imageHash = crypto.createHash('md5').update(buffer).digest('hex');
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
    const s3Key = `products/${itemId}.${ext}`;
    const s3Url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${s3Key}`;

    // ✅ Skip upload if image unchanged
    if (existingHash && existingHash === imageHash) {
      this.logger.log(`⏭️ Image unchanged for item ${itemId}, skipping upload`);
      return { s3Url, s3Key, imageHash, skipped: true };
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    this.logger.log(`✅ Uploaded to S3: ${s3Url}`);
    return { s3Url, s3Key, imageHash, skipped: false };
  }

  // ✅ Delete image from S3
  async deleteImage(s3Key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
        }),
      );
      this.logger.log(`🗑️ Deleted from S3: ${s3Key}`);
    } catch (err: any) {
      this.logger.error(`❌ Failed to delete from S3: ${s3Key} — ${err.message}`);
    }
  }
}