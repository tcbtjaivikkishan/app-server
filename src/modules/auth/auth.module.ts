import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ZohoModule } from '../../zoho/zoho.module';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    ZohoModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    PassportModule.register({ defaultStrategy: 'jwt' }), // 🔥 ADD THIS

    JwtModule.register({
      secret: 'SUPER_SECRET_KEY',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [PassportModule], // ✅ NOW VALID
})
export class AuthModule {}
