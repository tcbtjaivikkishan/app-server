import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZohoModule } from './zoho/zoho.module';
import { ProductsModule } from './products/products.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ZohoService } from './zoho/zoho.service';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CallbackController } from './callback.controller';
import { UploadModule } from './upload/upload.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),

    ZohoModule,
    ProductsModule,
    ScheduleModule.forRoot(),
    OrdersModule,
    UsersModule,
    AuthModule,
    UploadModule,
  ],
  controllers: [AppController, CallbackController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private zohoService: ZohoService) {}

  async onModuleInit() {
    await this.zohoService.initializeToken();
  }
}
