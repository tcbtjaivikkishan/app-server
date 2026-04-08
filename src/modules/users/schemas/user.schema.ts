import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class OTP {
  @Prop()
  code!: string;

  @Prop()
  expires_at!: Date;

  @Prop({ default: 0 })
  attempts!: number;
}

@Schema({ _id: true })
class Address {
  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  line1!: string;

  @Prop()
  line2?: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  state!: string;

  @Prop({ required: true })
  pincode!: string;

  @Prop({ default: false })
  is_default!: boolean;
}

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  mobile_number!: string;

  @Prop({ default: false })
  is_guest!: boolean;

  @Prop()
  guest_session_id?: string;

  @Prop()
  password_hash?: string;

  @Prop()
  name?: string;

  @Prop({ sparse: true })
  email?: string;

  @Prop({ type: OTP })
  otp?: OTP | null;

  @Prop({ type: [Address], default: [] })
  addresses!: Address[];

  @Prop({ type: [String], default: [] })
  fcm_tokens!: string[];

  @Prop({ default: true })
  is_active!: boolean;

  @Prop({ default: false })
  is_deleted!: boolean;

  @Prop()
  last_login_at?: Date;

  @Prop()
  zoho_contact_id?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
