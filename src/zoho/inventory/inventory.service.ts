import { Injectable } from '@nestjs/common';
import { ZohoHttpService } from '../core/zoho-http.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ZohoInventoryService {
  constructor(
    private http: ZohoHttpService,
    private config: ConfigService,
  ) {}

  private getOrgId() {
    return this.config.get<string>('ZOHO_ORG_ID') || '';
  }

  // ✅ GET ITEMS (already exists)
  async getItems(page = 1, perPage = 200): Promise<any> {
    return this.http.request(
      'GET',
      `https://www.zohoapis.in/inventory/v1/items?organization_id=${this.getOrgId()}&page=${page}&per_page=${perPage}`,
      'inventory',
    );
  }

  // 🔥 CREATE SALES ORDER (IMPORTANT)
  async createSalesOrder(order: any, customerId: string) {
    const payload = {
      customer_id: customerId,

      reference_number: order.orderId,

      line_items: order.items.map((item: any) => ({
        item_id: item.zohoItemId, // MUST EXIST
        name: item.name,
        rate: item.price,
        quantity: item.quantity,
      })),

      shipping_charge: order.shippingCharge,

      billing_address: {
        address: order.address.addressLine,
        city: order.address.city,
        state: order.address.state,
        zip: order.address.pincode,
        phone: order.address.phone,
      },

      shipping_address: {
        address: order.address.addressLine,
        city: order.address.city,
        state: order.address.state,
        zip: order.address.pincode,
        phone: order.address.phone,
      },
    };

    const response = await this.http.request(
      'POST',
      `https://www.zohoapis.in/inventory/v1/salesorders?organization_id=${this.getOrgId()}`,
      'inventory',
      payload,
    );

    return response.salesorder?.salesorder_id;
  }
}