import { Controller, Get, Query } from '@nestjs/common';
import { ShippingService } from './shipping.service';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('rate')
  async getRate(
    @Query('weight') weight: number,
    @Query('deliveryPincode') deliveryPincode: number,
  ) {
    return this.shippingService.calculateRate(weight, deliveryPincode);
  }
}