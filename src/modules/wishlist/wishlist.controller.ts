import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  // ✅ Get wishlist
  @Get(':userId')
  get(@Param('userId') userId: string) {
    return this.wishlistService.getWishlist(userId);
  }

  // ✅ Add item
  @Post()
  add(@Body() body: any) {
    return this.wishlistService.addToWishlist(
      body.userId,
      body.product,
    );
  }

  // ✅ Remove item
  @Delete(':productId')
  remove(
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    return this.wishlistService.removeFromWishlist(
      body.userId,
      productId,
    );
  }
}