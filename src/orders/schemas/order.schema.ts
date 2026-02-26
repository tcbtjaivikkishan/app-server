import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {

  @Prop({ required: true })
  order_number: string;

  @Prop({ required: true })
  customer_name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  address: string;

  @Prop({ type: Array, required: true })
  items: any[];

  @Prop({ required: true })
  total_amount: number;

  @Prop({ default: 'pending_payment' })
  status: string;

  @Prop({ default: 'pending' })
  payment_status: string;

  @Prop()
  zoho_invoice_id: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);