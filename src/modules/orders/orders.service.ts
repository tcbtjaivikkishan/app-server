import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ZohoPaymentGatewayService } from '../../integrations/payments/zoho-payment-gateway.service';
import { User } from '../users/schemas/user.schema';
import { ZohoInventoryService } from '../../zoho/inventory/inventory.service';
import { CartService } from '../cart/cart.service';
import { Product } from '../products/schemas/product.schema';

@Injectable()
export class OrdersService {
  constructor(
    private zohoInventoryService: ZohoInventoryService,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
    private cartService: CartService,
    private paymentService: ZohoPaymentGatewayService,
  ) { }

  async createOrder(userId: string, dto: any) {
    const { items, address } = dto;

    let totalAmount = 0;
    let totalWeight = 0;

    const processedItems = items.map((item: any) => {
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

    const shippingCharge = this.calculateShippingStub(totalWeight);
    const finalAmount = totalAmount + shippingCharge;

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

    const payment = await this.paymentService.createPaymentSession(order);


    order.paymentSessionId = payment?.payments_session_id;
    await order.save();

    return {
      orderId: order.orderId,
      paymentSessionId: order.paymentSessionId,
    };
  }

  async createOrderFromCart(userId: string, address: any) {
    const cart = await this.cartService.getCartSummaryByUser(userId);

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    const items = await Promise.all(
      cart.items.map(async (item: any) => {
        const product = await this.productModel.findById(item.product_id);

        if (!product) {
          throw new Error(`Product not found: ${item.product_id}`);
        }

        return {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          weight: product.weight || 1,
          image: product.image_url,
          zohoItemId: product.zoho_item_id, // 🔥 CRITICAL
        };
      }),
    );

    const order = await this.createOrder(userId, {
      items,
      address,
    });

    // 🔥 clear cart after order
    await this.cartService.mergeGuestIntoUser('', userId); // safe no-op
    await this.cartService.getOrCreateForUser(userId).then(c => {
      c.items = [];
      return c.save();
    });

    return order;
  }

  async getOrders(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      this.orderModel.countDocuments({ userId }),
    ]);

    return {
      data: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.orderModel.findOne({
      userId,
      orderId,
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.orderModel.findOne({
      userId,
      orderId,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.orderStatus === 'cancelled') {
      throw new BadRequestException('Order already cancelled');
    }

    if (order.orderStatus === 'confirmed') {
      throw new BadRequestException('Cannot cancel confirmed order');
    }

    order.orderStatus = 'cancelled';
    await order.save();

    return { message: 'Order cancelled successfully' };
  }

  private async getUserCartStub(userId: string) {
    return {
      items: [
        {
          productId: 'p1',
          name: 'Test Product',
          price: 100,
          quantity: 2,
          weight: 1,
          image: '',
        },
      ],
      address: {
        city: 'Bhopal',
        pincode: '462001',
      },
    };
  }

  async handlePaymentSuccess(orderId: string, paymentId: string, amount: number) {
    const order = await this.orderModel.findOne({ orderId });

    if (!order) throw new Error('Order not found');

    if (order.paymentStatus === 'paid') return;

    if (Math.abs(order.finalAmount - Number(amount)) > 0.01) {
      throw new Error('Amount mismatch');
    }


    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.paymentId = paymentId;

    await order.save();


    const user = await this.userModel.findById(order.userId);

    if (!user?.zoho_contact_id) {
      order.zohoSyncError = 'Missing zoho_contact_id';
      await order.save();
      return;
    }


    try {
      const zohoOrderId = await this.zohoInventoryService.createSalesOrder(
        order,
        user.zoho_contact_id,
      );

      order.zohoSalesOrderId = zohoOrderId;
      order.isSyncedToZoho = true;
      order.orderStatus = 'processing';

      await order.save();
    } catch (error: any) {
      console.error('Zoho Sync Failed:', error);

      order.zohoSyncError = error.message;
      await order.save();
    }
  }

  async handlePaymentFailure(orderId: string) {
    const order = await this.orderModel.findOne({ orderId });

    if (!order) return;

    if (order.paymentStatus === 'paid') return;

    order.paymentStatus = 'failed';
    await order.save();
  }

  private calculateShippingStub(weight: number): number {
    if (weight < 5) return 50;
    if (weight < 20) return 120;
    return 300;
  }
}