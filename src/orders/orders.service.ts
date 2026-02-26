import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './schemas/order.schema';

@Injectable()
export class OrdersService {

    constructor(
        @InjectModel(Order.name)
        private orderModel: Model<Order>,
      ) { }

    async createOrder(dto: any) {
        const orderNumber = `ORD-${Date.now()}`;

        const newOrder = await this.orderModel.create({
            order_number: orderNumber,
            ...dto,
            status: 'pending_payment',
            payment_status: 'pending',
        });

        return newOrder;
    }
}
