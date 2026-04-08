import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Wishlist extends Document {
    @Prop({ required: true, unique: true })
    userId!: string;

    @Prop([
        {
            productId: String,
            name: String,
            price: Number,
            image: String,
        },
    ])
    items!: {
        productId: string;
        name: string;
        price: number;
        image: string;
    }[];
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);