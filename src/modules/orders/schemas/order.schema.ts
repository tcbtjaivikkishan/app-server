import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
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

  @Prop()
  totalAmount!: number;

  @Prop()
  shippingCharge!: number;

  @Prop()
  finalAmount!: number;

  @Prop({ default: 'created' })
  orderStatus!: string;

  @Prop({ default: 'pending' })
  paymentStatus!: string;

  @Prop({ type: Object })
  address!: {
    name: string;
    phone: string;
    pincode: string;
    city: string;
    state: string;
    addressLine: string;
  };

  @Prop()
  zohoSalesOrderId?: string;

  @Prop()
  paymentId?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);