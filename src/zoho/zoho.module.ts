import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZohoToken, ZohoTokenSchema } from './zoho-token.schema';
import { ZohoService } from './zoho.service';
import { ZohoWebhookController } from './zoho-webhook.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ZohoToken.name, schema: ZohoTokenSchema },
    ]),
    forwardRef(() => ProductsModule), // ← avoids circular dependency
  ],
  controllers: [ZohoWebhookController],
  providers: [ZohoService],
  exports: [ZohoService],
})
export class ZohoModule {}