import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ZohoImageSyncController } from './zoho-image-sync.controller';
import { ZohoImageSyncService } from './zoho-image-sync.service';
import { S3UploadService } from '../../common/s3-upload.service';
import { CoreModule } from '../../zoho/core/core.module';
import { Product, ProductSchema } from '../../modules/products/schemas/product.schema';

@Module({
  imports: [
    CoreModule,
    ConfigModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [ZohoImageSyncController],
  providers: [ZohoImageSyncService, S3UploadService],
})
export class ZohoImageSyncModule {}