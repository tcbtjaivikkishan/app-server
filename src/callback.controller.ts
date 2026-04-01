import { Controller, Get, Query } from '@nestjs/common';
import { ZohoService } from './zoho/zoho.service';

@Controller('callback')
export class CallbackController {
  constructor(private zohoService: ZohoService) {}

  @Get()
  async handleCallback(@Query('code') code: string) {
    console.log('AUTH CODE:', code);

    // 🔥 exchange code → token
    const result = await this.zohoService.exchangeCodeForToken(code);

    return {
      message: 'Zoho token stored successfully',
      result,
    };
  }
}