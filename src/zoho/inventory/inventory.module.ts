import { Module } from '@nestjs/common';
import { ZohoInventoryService } from './inventory.service';

@Module({
  providers: [ZohoInventoryService]
})
export class InventoryModule {}
