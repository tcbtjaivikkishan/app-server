import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CrmService } from './zoho/crm/crm.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly zohoCRMService: CrmService,
  ) {}

  @Get('test-crm')
  testCRM() {
    return this.zohoCRMService.createContact({
      First_Name: 'Test',
      Last_Name: 'User',
      Email: 'testuser@gmail.com',
      Phone: '9876543210',
    });
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}