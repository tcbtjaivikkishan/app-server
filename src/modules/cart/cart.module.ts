import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { RedisModule } from '../../common/redis/redis.module';
import { ProductsModule } from '../products/products.module';

@Module({
    imports: [
        RedisModule,
        ProductsModule,
    ],
    controllers: [CartController],
    providers: [CartService],
})
export class CartModule { }