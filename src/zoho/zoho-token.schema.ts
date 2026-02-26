import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ZohoToken extends Document {

  @Prop({ required: true })
  access_token: string;

  @Prop({ required: true })
  refresh_token: string;

  @Prop({ required: true })
  expires_at: number; // store timestamp in ms

}

export const ZohoTokenSchema = SchemaFactory.createForClass(ZohoToken);
