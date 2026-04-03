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

    return res.json();
  }
}