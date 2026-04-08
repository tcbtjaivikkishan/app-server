/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// zoho/core/zoho-auth.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ZohoToken } from '../schemas/zoho-token.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ZohoAuthService {
  constructor(
    @InjectModel(ZohoToken.name)
    private tokenModel: Model<ZohoToken>,
    private configService: ConfigService,
  ) {}

  // ✅ FIXED: supports service
  async exchangeCodeForToken(code: string, service: string) {
    const clientId = this.configService.getOrThrow('ZOHO_CLIENT_ID');

    const clientSecret = this.configService.getOrThrow('ZOHO_CLIENT_SECRET');

    const redirectUri = this.configService.getOrThrow('ZOHO_REDIRECT_URI');

    const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error);

    // ✅ IMPORTANT: no deleteMany
    await this.tokenModel.findOneAndUpdate(
      { service },
      {
        service,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      },
      { upsert: true },
    );

    return data;
  }

  async getValidAccessToken() {
    const token = await this.tokenModel.findOne();

    if (!token) {
      throw new Error('Zoho token not found. Please re-authenticate.');
    }

    if (Date.now() > token.expires_at) {
      return this.refreshAccessToken(token);
    }

    return token.access_token;
  }

  async refreshAccessToken(tokenDoc: ZohoToken) {
    const clientId = this.configService.getOrThrow('ZOHO_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow('ZOHO_CLIENT_SECRET');

    const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: tokenDoc.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    tokenDoc.access_token = data.access_token;
    tokenDoc.expires_at = Date.now() + data.expires_in * 1000;

    await tokenDoc.save();

    return tokenDoc.access_token;
  }
}
