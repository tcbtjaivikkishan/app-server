import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ShippingService {

  async calculateRate(weight: number, deliveryPincode: number) {
    try {

      const payload = {
        order_id: " ",                 // hardcoded
        pickup_pincode: 482003,             // your warehouse
        delivery_pincode: deliveryPincode,  // dynamic
        payment_type: "PREPAID",
        shipment_type: "FORWARD",
        order_amount: 1000,
        type_of_package: "B2B",
        rov_type: "ROV_OWNER",
        cod_amount: 0,
        weight: weight,
        dimensions: [
          {
            no_of_box: 1,
            length: 22,
            width: 10,
            height: 10
          }
        ]
      };

      const response = await axios.post(
        'https://shipping-api.com/app/api/v1/rate-calculator',
        payload,
        {
          headers: {
            'public-key': process.env.SHIPMOZO_SHIPPING_PUBLIC_KEY,
            'private-key': process.env.SHIPMOZO_SHIPPING_PRIVATE_KEY,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;

    } catch (error) {
      console.log(error);
      throw new HttpException(
        error?.response?.data || 'Rate API failed',
        error?.response?.status || 500,
      );
    }
  }
}