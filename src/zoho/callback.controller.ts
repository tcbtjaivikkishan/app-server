import { Controller, Get, Query } from '@nestjs/common';
import { ZohoAuthService } from './core/zoho-auth.service';

@Controller('callback')
export class CallbackController {
  constructor(private zohoAuthService: ZohoAuthService) { }

  @Get()
  async handleCallback(@Query('code') code: string) {
    if (!code) {
      throw new Error('Authorization code missing');
    }

    const data = await this.zohoAuthService.exchangeCodeForToken(code);

    return {
      message: 'Zoho token saved successfully',
      data,
    };
  }
}