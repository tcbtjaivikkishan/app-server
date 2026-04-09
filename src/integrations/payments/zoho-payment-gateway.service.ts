import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ZohoAuthService } from '../../zoho/core/zoho-auth.service';

@Injectable()
export class ZohoPaymentGatewayService {
  constructor(private readonly zohoAuth: ZohoAuthService) { }

  async createPaymentSession(data: {
    orderId: string;
    amount: number;
    customerName: string;
    email: string;
    mobile: string;
  }) {
    const accessToken = await this.zohoAuth.getValidAccessToken('payments');

    const payload = {
      amount: data.amount,
      currency: 'INR',
      purpose: `Order ${data.orderId}`, // ✅ IMPORTANT (NOT description)

      buyer_name: data.customerName,
      email: data.email,
      phone: data.mobile,

      redirect_url: 'https://your-frontend.com/success',
      webhook_url: 'https://your-backend.com/payments/webhook',
    };

    const response = await axios.post(
      'https://payments.zoho.in/api/v1/hostedpages', // 🔥 IMPORTANT ENDPOINT
      payload,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      },
    );

    return response.data;
  }
}