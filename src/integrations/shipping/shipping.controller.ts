import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CalculateRateDto } from './dto/calculate-rate.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('rate')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getRate(@Body() body: CalculateRateDto) {
    return this.shippingService.calculateRate(
      body.weight,
      body.deliveryPincode,
      body.type_of_package,
    );
  }
}