import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  private bucket = process.env.AWS_S3_BUCKET_NAME as string;

  async uploadFile(file: Express.Multer.File, folder = 'products') {
    try {
      const ext = file.originalname.split('.').pop();
      const key = `${folder}/${randomUUID()}.${ext}`;

      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));

      return {
        key,
        url: `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new InternalServerErrorException('S3 upload failed');
    }
  }

  async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<{ key: string; url: string }> {
    try {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }));

      return {
        key,
        url: `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      };
    } catch (error) {
      console.error('S3 uploadBuffer error:', error);
      throw new InternalServerErrorException('S3 upload failed');
    }
  }

  async deleteFile(key: string) {
    try {
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
    } catch (error) {
      throw new InternalServerErrorException('S3 delete failed');
    }
  }
}
