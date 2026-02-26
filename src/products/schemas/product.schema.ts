import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {

  @Prop({ required: true, unique: true })
  zoho_item_id: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ index: true })
  slug: string;

  @Prop()
  description: string;

  @Prop({ required: true, index: true })
  price: number;

  @Prop({ index: true })
  sku: string;

  @Prop({ default: 0, index: true })
  stock: number;

  @Prop({ default: true, index: true })
  is_active: boolean;

  @Prop({ type: String, index: true })
  category: string;

  @Prop({ type: [String], index: true })
  tags: string[];

  @Prop({ type: Object })
  attributes: Record<string, any>;

  @Prop()
  images: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
