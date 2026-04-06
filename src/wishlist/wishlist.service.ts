import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Wishlist } from './schema/wishlist.schema';
import { Model } from 'mongoose';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private wishlistModel: Model<Wishlist>,
  ) {}

  async getWishlist(userId: string) {
    let wishlist = await this.wishlistModel.findOne({ userId });

    if (!wishlist) {
      wishlist = await this.wishlistModel.create({
        userId,
        items: [],
      });
    }

    return wishlist;
  }

  async addToWishlist(userId: string, product: any) {
    const wishlist = await this.getWishlist(userId);

    const exists = wishlist.items.find(
      (item) => item.productId === product.productId,
    );

    if (exists) {
      return wishlist; // already added
    }

    wishlist.items.push(product);
    await wishlist.save();

    return wishlist;
  }

  async removeFromWishlist(userId: string, productId: string) {
    const wishlist = await this.getWishlist(userId);

    wishlist.items = wishlist.items.filter(
      (item) => item.productId !== productId,
    );

    await wishlist.save();

    return wishlist;
  }
}