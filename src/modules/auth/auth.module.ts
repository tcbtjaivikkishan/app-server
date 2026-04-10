import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ZohoModule } from '../../zoho/zoho.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '../../common/redis/redis.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    ZohoModule,
    RedisModule,
    CartModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const ttl = cfg.get<string>('ACCESS_TOKEN_TTL') ?? '15m';
    
        return {
          secret: cfg.getOrThrow<string>('JWT_ACCESS_SECRET'),
          signOptions: {
            expiresIn: ttl as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}