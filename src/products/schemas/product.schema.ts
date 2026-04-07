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

  // S3 image URL — set after syncing image from Zoho → S3
  @Prop({ default: '' })
  image_url: string;

  // S3 key — used to delete old image when product image is updated
  @Prop({ default: '' })
  image_key: string;
 
  // After image_key prop
@Prop({ default: '' })
image_hash: string;

  // Zoho image reference
  @Prop({ default: '' })
  zoho_image_document_id: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: true })
  show_in_storefront: boolean;

  @Prop({ default: 0 })
  weight: number;

  @Prop({ default: 0 })
  length: number;

  @Prop({ default: 0 })
  width: number;

  @Prop({ default: 0 })
  height: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
