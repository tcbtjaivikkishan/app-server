import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZohoToken, ZohoTokenSchema } from './zoho-token.schema';
import { ZohoService } from './zoho.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ZohoToken.name, schema: ZohoTokenSchema },
    ]),
  ],
  providers: [ZohoService],
  exports: [ZohoService],
})
export class ZohoModule {}
