import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);
  private s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.getOrThrow('AWS_REGION'),
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
    });

    const buffer = Buffer.from(response.data);

    const imageHash = crypto.createHash('md5').update(buffer).digest('hex');

    const bucket = this.configService.getOrThrow('AWS_S3_BUCKET_NAME');
    const region = this.configService.getOrThrow('AWS_REGION');
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
    const s3Key = `products/${itemId}.${ext}`;
    const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

    // ✅ Skip upload if image hasn't changed
    if (existingHash && existingHash === imageHash) {
      this.logger.log(`⏭️ Image unchanged for item ${itemId}, skipping upload`);
      return { s3Url, s3Key, imageHash, skipped: true };
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    this.logger.log(`✅ Uploaded to S3: ${s3Url}`);
    return { s3Url, s3Key, imageHash, skipped: false };
  }
}