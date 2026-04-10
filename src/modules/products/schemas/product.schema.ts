import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true }) // ← unique: true already creates an index
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
  image_name!: string;

  @Prop()
  zoho_image_document_id!: string;

  @Prop()
  image_hash!: string;

  @Prop()
  image_s3_key!: string;

  @Prop()
  image_last_synced_at!: Date;

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

// ✅ Remove zoho_item_id index here — already handled by unique:true above
ProductSchema.index({ category_id: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ is_active: 1, show_in_storefront: 1 });
ProductSchema.index({ price: 1 });