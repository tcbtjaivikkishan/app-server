import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ShipmentService } from './shipment.service';
import { ShipmentController } from './shipment.controller';

@Module({
  imports: [HttpModule],
  controllers: [ShipmentController],
  providers: [ShipmentService],
})
export class ShipmentModule {}
