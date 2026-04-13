import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedRequestUser } from '../auth/jwt.strategy';
import { GuestCartDto } from './dto/guest-cart.dto';
import { UpsertCartItemDto } from './dto/upsert-cart-item.dto';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('guest')
  getGuestCart(@Body() body: GuestCartDto) {
    return this.cartService.getCartSummaryByGuest(body.guest_session_id ?? '');
  }

  @Patch('guest/items')
  upsertGuestItem(@Body() body: GuestCartDto & UpsertCartItemDto) {
    return this.cartService.upsertItemForGuest(
      body.guest_session_id ?? '',
      body.product_id,
      body.quantity,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getMyCart(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.cartService.getCartSummaryByUser(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('items')
  upsertMyItem(@CurrentUser() user: AuthenticatedRequestUser, @Body() body: UpsertCartItemDto) {
    return this.cartService.upsertItemForUser(user.userId, body.product_id, body.quantity);
  }
}

