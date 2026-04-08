import { Controller, Post, Body, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  async createOrder(@Req() req: any, @Body() body: any) {
    const userId = req.user?.userId || 'test-user';

    return this.ordersService.createOrder(userId, body);
  }
}