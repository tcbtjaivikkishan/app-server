import { Controller, Get, Query } from '@nestjs/common';
import { ZohoAuthService } from './core/zoho-auth.service';

@Controller('callback')
export class CallbackController {
  constructor(private zohoAuthService: ZohoAuthService) {}

  @Get()
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    if (!code) {
      throw new Error('Missing code');
    }

    if (!state) {
      throw new Error('Missing state (crm or inventory)');
    }

    const data =
      await this.zohoAuthService.exchangeCodeForToken(
        code,
        state,
      );

    console.log(`${state} token stored`);

    return {
      message: `${state} token stored successfully`,
    };
  }
}
