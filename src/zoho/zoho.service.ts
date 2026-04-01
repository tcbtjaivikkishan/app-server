/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

  async exchangeCodeForToken(code: string) {
  const clientId =
    this.configService.getOrThrow<string>('ZOHO_CLIENT_ID');

  const clientSecret =
    this.configService.getOrThrow<string>('ZOHO_CLIENT_SECRET');

  const redirectUri =
    this.configService.getOrThrow<string>('ZOHO_REDIRECT_URI');

  const response = await fetch(
    'https://accounts.zoho.in/oauth/v2/token',
    {
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
    },
  );

  const data = await response.json();

  console.log('TOKEN RESPONSE:', data);

  if (data.error) {
    throw new Error(data.error);
  }

  // 🔥 save in DB
  await this.tokenModel.deleteMany({});

  await this.tokenModel.create({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  });

  return data;
}

async upsertContact(user: any) {
  const accessToken = await this.getValidAccessToken();

  // 🔹 1. Search existing contact by phone
  const searchRes = await fetch(
    `https://www.zohoapis.in/crm/v2/Contacts/search?phone=${user.mobile_number}`,
    {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    },
  );

  const searchData = await searchRes.json();

  if (searchData.data && searchData.data.length > 0) {
    return searchData.data[0].id;
  }

  // 🔹 2. Create new contact
  const [firstName, ...rest] = (user.name || 'Guest').split(' ');
  const lastName = rest.join(' ') || 'Customer';

  const createRes = await fetch(
    'https://www.zohoapis.in/crm/v2/Contacts',
    {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [
          {
            First_Name: firstName,
            Last_Name: lastName,
            Phone: user.mobile_number,
            Email: user.email,
          },
        ],
      }),
    },
  );

  const createData = await createRes.json();

  if (createData.data?.[0]?.code !== 'SUCCESS') {
    throw new Error(JSON.stringify(createData));
  }

  return createData.data[0].details.id;
}

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

  async createContact(data: any) {
  const accessToken = await this.getValidAccessToken();

  const response = await fetch(
    'https://www.zohoapis.in/crm/v2/Contacts',
    {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [data],
      }),
    },
  );

  const result = await response.json();

  console.log('CRM Response:', result);

  if (result.data?.[0]?.code !== 'SUCCESS') {
    throw new Error(JSON.stringify(result));
  }

  return result;
}

  async getValidAccessToken(): Promise<string> {
    const tokenDoc = await this.tokenModel.findOne();

    if (!tokenDoc) {
      throw new Error('Zoho token not initialized');
    }

    const now = Date.now();

    if (now >= tokenDoc.expires_at - 60000) {
      // eslint-disable-next-line prettier/prettier
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
