/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// zoho/crm/zoho-crm.service.ts

import { Injectable } from '@nestjs/common';
import { ZohoHttpService } from '../core/zoho-http.service';

@Injectable()
export class CrmService {
  constructor(private http: ZohoHttpService) {}

  async createContact(data: any) {
    const res = await this.http.request(
      'crm',
      'POST',
      'https://www.zohoapis.in/crm/v2/Contacts',
      { data: [data] },
    );

    // ✅ RETURN ONLY ID
    return res?.data?.[0]?.details?.id;
  }

  async upsertContact(user: any) {
    const search = await this.http.request(
      'crm',
      'GET',
      `https://www.zohoapis.in/crm/v2/Contacts/search?criteria=(Phone:equals:${user.mobile_number})`,
    );

    console.log('Zoho search response:', search);

    // ✅ FULL SAFE GUARD
    if (search && Array.isArray(search.data) && search.data.length > 0) {
      return search.data[0].id;
    }

    // ⚠️ If null → still continue
    return this.createContact({
      First_Name: user.name || 'Guest',
      Last_Name: 'Customer',
      Phone: user.mobile_number,
      Email: user.email,
    });
  }
}
