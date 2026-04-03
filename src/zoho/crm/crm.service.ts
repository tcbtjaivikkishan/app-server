// zoho/crm/zoho-crm.service.ts

import { Injectable } from '@nestjs/common';
import { ZohoHttpService } from '../core/zoho-http.service';

@Injectable()
export class CrmService {
  constructor(private http: ZohoHttpService) {}

  async createContact(data: any) {
    return this.http.request(
      'crm',
      'POST',
      'https://www.zohoapis.in/crm/v2/Contacts',
      { data: [data] },
    );
  }

  async upsertContact(user: any) {
    const search = await this.http.request(
      'crm',
      'GET',
      `https://www.zohoapis.in/crm/v2/Contacts/search?phone=${user.mobile_number}`,
    );

    if (search.data?.length) {
      return search.data[0].id;
    }

    return this.createContact({
      First_Name: user.name,
      Last_Name: 'Customer',
      Phone: user.mobile_number,
      Email: user.email,
    });
  }
}