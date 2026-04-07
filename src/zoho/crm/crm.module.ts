import { Module } from '@nestjs/common';
import { CrmService } from './crm.service';
import { ZohoModule } from '../zoho.module';

@Module({
  imports: [ZohoModule],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
