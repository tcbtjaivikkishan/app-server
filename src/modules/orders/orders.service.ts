import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ZohoPaymentGatewayService } from '../../integrations/payments/zoho-payment-gateway.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private paymentService: ZohoPaymentGatewayService,
  ) { }

  async createOrder(userId: string, dto: any) {
    const { items, address, user } = dto;

    // ✅ 1. Calculate totals (DO NOT TRUST FRONTEND)
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

    // 🚚 2. Shipping
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
      orderStatus: 'created',
      paymentStatus: 'pending',
    });

    // 💳 4. Create Payment Session
    const payment = await this.paymentService.createPaymentSession({
      orderId: order.orderId,
      amount: finalAmount,
      customerName: user?.name,
      email: user?.email,
      mobile: user?.mobile,
    });

    // 🧠 5. Save payment session
    order.paymentSessionId = payment?.hostedpage?.url; await order.save();

    return {
      orderId: order.orderId,
      paymentSessionId: order.paymentSessionId,
    };
  }

  // 🔔 PAYMENT SUCCESS (Webhook)
  async handlePaymentSuccess(
    orderId: string,
    paymentId: string,
    amount: number,
  ) {
    const order = await this.orderModel.findOne({ orderId });

    if (!order) throw new Error('Order not found');

    // 🔐 Idempotency
    if (order.paymentStatus === 'paid') return;

    // 🔒 Verify amount
    if (order.finalAmount !== amount) {
      throw new Error('Amount mismatch');
    }

    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.paymentId = paymentId;

    await order.save();
  }

  // ❌ PAYMENT FAILURE
  async handlePaymentFailure(orderId: string) {
    const order = await this.orderModel.findOne({ orderId });

    if (!order) return;

    if (order.paymentStatus === 'paid') return;

    order.paymentStatus = 'failed';
    await order.save();
  }

  // 🚚 SHIPPING STUB
  private calculateShippingStub(weight: number): number {
    if (weight < 5) return 50;
    if (weight < 20) return 120;
    return 300;
  }
}