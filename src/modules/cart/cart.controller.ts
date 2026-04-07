import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }


  @Get(':userId')
  getCart(@Param('userId') userId: string) {
    return this.cartService.getCart(userId);
  }


  @Post('items')
  addItem(@Body() body: any) {
    return this.cartService.addToCart(body.userId, body.item);
  }


  @Patch('items/:productId')
  updateQuantity(
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    return this.cartService.updateQuantity(
      body.userId,
      productId,
      body.quantity,
    );
  }


  @Delete('items/:productId')
  removeItem(
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    return this.cartService.removeItem(body.userId, productId);
  }


  @Delete(':userId')
  clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}