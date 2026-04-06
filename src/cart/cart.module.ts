import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
    imports: [RedisModule],
    controllers: [CartController],
    providers: [CartService],
})
export class CartModule { }