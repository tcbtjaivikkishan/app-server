import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true })
  zoho_item_id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description!: string;

  @Prop()
  sku!: string;

  @Prop()
  category_id!: string;

  @Prop()
  category_name!: string;

  @Prop()
  price!: number;

  @Prop()
  stock!: number;

  @Prop({ default: true })
  track_inventory!: boolean;

  @Prop()
  image_url!: string;

  @Prop()
  zoho_image_document_id!: string;

  @Prop({ default: true })
  is_active!: boolean;

  @Prop({ default: true })
  show_in_storefront!: boolean;

  @Prop()
  weight!: number;

  @Prop()
  length!: number;

  @Prop()
  width!: number;

  @Prop()
  height!: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes
ProductSchema.index({ category_id: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ is_active: 1, show_in_storefront: 1 });
ProductSchema.index({ price: 1 });
