import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/common/redis/redis.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    private redis: RedisService
  ) { }

  private getKey(userId: string) {
    return `cart:${userId}`;
  }

  async getCart(userId: string) {
    return (await this.redis.get(this.getKey(userId))) || { items: [] };
  }

  async addToCart(userId: string, item: any) {
    const key = this.getKey(userId);


    const product = await this.productModel.findById(item.productId);

    if (!product) {
      throw new Error('Product not found');
    }

    const cart = await this.getCart(userId);

    const existingItem = cart.items.find(
      (i) => i.productId === item.productId,
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        quantity: item.quantity,
      });
    }

    await this.redis.set(key, cart, 604800);

    return cart;
  }

  async updateQuantity(userId: string, productId: string, quantity: number) {
    const key = this.getKey(userId);
    const cart = await this.getCart(userId);

    cart.items = cart.items.map((item) =>
      item.productId === productId
        ? { ...item, quantity }
        : item,
    );

    await this.redis.set(key, cart, 604800);

    return cart;
  }

  async removeItem(userId: string, productId: string) {
    const key = this.getKey(userId);
    const cart = await this.getCart(userId);

    cart.items = cart.items.filter(
      (item) => item.productId !== productId,
    );

    await this.redis.set(key, cart, 604800);

    return cart;
  }

  async clearCart(userId: string) {
    return this.redis.del(this.getKey(userId));
  }
}