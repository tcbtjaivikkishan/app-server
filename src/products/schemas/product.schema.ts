import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {

  @Prop({ required: true, unique: true })
  zoho_item_id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  sku: string;

  @Prop()
  category_id: string;

  @Prop()
  category_name: string;

  @Prop()
  price: number;

  @Prop()
  stock: number;

  @Prop({ default: true })
  track_inventory: boolean;

  // AWS S3 image URL (MANUAL upload)
  @Prop()
  image_url: string;

  // Zoho image reference (optional)
  @Prop()
  zoho_image_document_id: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: true })
  show_in_storefront: boolean;

  @Prop()
  weight: number;

  @Prop()
  length: number;

  @Prop()
  width: number;

  @Prop()
  height: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);