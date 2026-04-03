import { Controller, Get, Query } from '@nestjs/common';
import { ZohoAuthService } from './core/zoho-auth.service';

@Controller('callback')
export class CallbackController {
  constructor(private zohoAuthService: ZohoAuthService) {}

  @Get()
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string, // 'crm' or 'inventory'
  ) {
    const data =
      await this.zohoAuthService.exchangeCodeForToken(
        code,
        state,
      );

    return {
      message: `${state} token saved`,
      data,
    };
  }
}