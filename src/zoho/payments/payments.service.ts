import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ZohoToken } from '../schemas/zoho-token.schema';

@Injectable()
export class ZohoPaymentsService {
  constructor(
    @InjectModel(ZohoToken.name)
    private tokenModel: Model<ZohoToken>,
  ) { }

  async exchangeCodeForToken(code: string) {
    try {
      const response = await axios.post(
        'https://accounts.zoho.in/oauth/v2/token',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            client_id: process.env.ZOHO_PAYMENTS_CLIENT_ID,
            client_secret: process.env.ZOHO_PAYMENTS_CLIENT_SECRET,
            redirect_uri: process.env.ZOHO_REDIRECT_URI,
            code,
          },
        },
      );

      const data = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      // ⏱ Convert expires_in → expires_at
      const expiresAt = Date.now() + data.expires_in * 1000;

      // 💾 Save token (IMPORTANT: separate service key)
      await this.tokenModel.findOneAndUpdate(
        { service: 'payments' },
        {
          service: 'payments',
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: expiresAt,
        },
        { upsert: true, new: true },
      );

      return data;
    } catch (error: unknown) {
      const err = error as AxiosError;

      console.error(
        'Zoho Payment Error:',
        err.response?.data || err.message,
      );

      throw error;
    }
  }

  async getValidAccessToken(): Promise<string> {
    const token = await this.tokenModel.findOne({ service: 'payments' });

    if (!token) {
      throw new Error('Zoho payment token not found');
    }

    // ⏳ Check expiry
    if (Date.now() > token.expires_at) {
      return this.refreshAccessToken(token.refresh_token);
    }

    return token.access_token;
  }

  async refreshAccessToken(refreshToken: string) {
    const response = await axios.post(
      'https://accounts.zoho.in/oauth/v2/token',
      null,
      {
        params: {
          grant_type: 'refresh_token',
          client_id: process.env.ZOHO_PAYMENTS_CLIENT_ID,
          client_secret: process.env.ZOHO_PAYMENTS_CLIENT_SECRET,
          refresh_token: refreshToken,
        },
      },
    );

    const data = response.data;

    const expiresAt = Date.now() + data.expires_in * 1000;

    await this.tokenModel.findOneAndUpdate(
      { service: 'payments' },
      {
        access_token: data.access_token,
        expires_at: expiresAt,
      },
    );

    return data.access_token;
  }
}