import { Controller, Post, Body, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async createOrder(@Req() req, @Body() dto) {
    const userId = req.user.id; // from auth middleware
    return this.ordersService.createOrder(userId, dto);
  }
}