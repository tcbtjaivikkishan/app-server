import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true, unique: true })
  orderId!: string;

  @Prop({ type: Array, required: true })
  items!: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    weight: number;
    image?: string;
  }[];

  @Prop({ required: true })
  totalAmount!: number;

  @Prop({ required: true })
  shippingCharge!: number;

  @Prop({ required: true })
  finalAmount!: number;

  // 📦 ORDER STATUS
  @Prop({
    enum: ['created', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'created',
  })
  orderStatus!: string;

  // 💳 PAYMENT STATUS
  @Prop({
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  })
  paymentStatus!: string;

  @Prop({ type: Object, required: true })
  address!: {
    name: string;
    phone: string;
    pincode: string;
    city: string;
    state: string;
    addressLine: string;
  };

  // 💳 Payment Fields
  @Prop()
  paymentSessionId?: string;

  @Prop()
  paymentId?: string;

  // 📦 Future (Zoho Inventory)
  @Prop()
  zohoSalesOrderId?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);