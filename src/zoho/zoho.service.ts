import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ZohoToken } from './zoho-token.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ZohoService {
  constructor(
    @InjectModel(ZohoToken.name)
    private tokenModel: Model<ZohoToken>,
    private configService: ConfigService,
  ) {}

  async initializeToken() {
    const refreshToken =
      this.configService.getOrThrow<string>('ZOHO_REFRESH_TOKEN');

    const newToken = await this.refreshAccessToken(refreshToken);

    await this.tokenModel.deleteMany({});

    await this.tokenModel.create({
      access_token: newToken.access_token,
      refresh_token: refreshToken,
      expires_at: Date.now() + newToken.expires_in * 1000,
    });

    console.log('Zoho token initialized successfully');
  }

  async getValidAccessToken(): Promise<string> {
    const tokenDoc = await this.tokenModel.findOne();

    if (!tokenDoc) {
      throw new Error('Zoho token not initialized');
    }

    const now = Date.now();

    if (now >= tokenDoc.expires_at - 60000) {
      const newToken = await this.refreshAccessToken(
        tokenDoc.refresh_token,
      );

      tokenDoc.access_token = newToken.access_token;
      tokenDoc.expires_at =
        Date.now() + newToken.expires_in * 1000;

      await tokenDoc.save();
    }

    return tokenDoc.access_token;
  }

  async refreshAccessToken(refreshToken: string) {
    const clientId =
      this.configService.getOrThrow<string>('ZOHO_CLIENT_ID');

    const clientSecret =
      this.configService.getOrThrow<string>('ZOHO_CLIENT_SECRET');

    const response = await fetch(
      'https://accounts.zoho.in/oauth/v2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
        }),
      },
    );

    const data = await response.json();
    console.log('Zoho refresh response:', data);

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  }
}