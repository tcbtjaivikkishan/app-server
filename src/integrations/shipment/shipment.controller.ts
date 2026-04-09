import { Controller, Get, Query } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';

@Controller('shipping')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Get('calculate')
  async calculate(@Query() dto: CalculateShippingDto): Promise<any> {
    return this.shipmentService.calculateShipping(dto);
  }
}
