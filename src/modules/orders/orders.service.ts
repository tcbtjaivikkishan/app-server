import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  async createOrder(userId: string, dto: any) {
    const { items, address } = dto;

    // ✅ 1. Calculate totals
    let totalAmount = 0;
    let totalWeight = 0;

    const processedItems = items.map((item) => {
      totalAmount += item.price * item.quantity;
      totalWeight += item.weight * item.quantity;

      return {
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        weight: item.weight,
        image: item.image,
      };
    });

    // 🚚 2. SHIPPING PLACEHOLDER (will replace with API)
    const shippingCharge = this.calculateShippingStub(totalWeight);

    const finalAmount = totalAmount + shippingCharge;

    // 🆔 3. Create Order
    const order = await this.orderModel.create({
      userId,
      orderId: `ORD-${uuidv4()}`,
      items: processedItems,
      totalAmount,
      shippingCharge,
      finalAmount,
      address,
    });

    return order;
  }

  // 🔥 TEMP STUB — REPLACE WITH LIVE API LATER
  private calculateShippingStub(weight: number): number {
    if (weight < 5) return 50;
    if (weight < 20) return 120;
    return 300;
  }
}