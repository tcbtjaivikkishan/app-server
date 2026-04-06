import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CrmService } from './zoho/crm/crm.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly zohoCRMService: CrmService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
