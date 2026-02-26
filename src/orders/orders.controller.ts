import { Body, Controller, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
    
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    async create(@Body() body: any) {
        return this.ordersService.createOrder(body);
    }
}
