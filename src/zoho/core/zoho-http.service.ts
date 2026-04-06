/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// zoho/core/zoho-http.service.ts

import { Injectable } from '@nestjs/common';
import { ZohoAuthService } from './zoho-auth.service';

@Injectable()
export class ZohoHttpService {
  constructor(private auth: ZohoAuthService) {}

  async request(service: string, method: string, url: string, body?: any) {
    const token = await this.auth.getValidAccessToken(service);

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text(); // ✅ ALWAYS SAFE

    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      console.error('Non-JSON response:', text);
      throw new Error('Zoho returned invalid JSON');
    }

    if (!res.ok) {
      console.error('Zoho API Error:', data || text);
      throw new Error(data?.message || 'Zoho API failed');
    }

    return data;
  }
}
