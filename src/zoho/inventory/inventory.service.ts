/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// zoho/inventory/zoho-inventory.service.ts

import { Injectable } from '@nestjs/common';
import { ZohoHttpService } from '../core/zoho-http.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ZohoInventoryService {
  constructor(
    private http: ZohoHttpService,
    private config: ConfigService,
  ) {}

  async getItems(page: number, perPage: number) {
    const orgId = this.config.get('ZOHO_ORG_ID');

    return this.http.request(
      'GET',
      `https://www.zohoapis.in/inventory/v1/items?organization_id=${orgId}`,
    );
  }
}
