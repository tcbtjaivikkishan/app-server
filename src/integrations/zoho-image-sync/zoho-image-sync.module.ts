import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ZohoImageSyncController } from './zoho-image-sync.controller';
import { ZohoImageSyncService } from './zoho-image-sync.service';
import { S3UploadService } from '../../common/s3-upload.service';
import { CoreModule } from '../../zoho/core/core.module';
import { Product, ProductSchema } from '../../modules/products/schemas/product.schema';
import { ZohoModule } from '../../zoho/zoho.module';

@Module({
  imports: [
    CoreModule,
    ConfigModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
    ]),
    ZohoModule,
  ],
  controllers: [ZohoImageSyncController],
  providers: [ZohoImageSyncService, ZohoModule, S3UploadService],
  exports: [ZohoImageSyncService],
})
export class ZohoImageSyncModule { }