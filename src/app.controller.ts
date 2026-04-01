import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ZohoService } from './zoho/zoho.service';

@Controller()
export class AppController {
  [x: string]: any;
  constructor(
    private readonly appService: AppService,
    private readonly zohoService: ZohoService,
  ) {}

  @Get('test-crm')
  testCRM() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return this.zohoService.createContact({
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
