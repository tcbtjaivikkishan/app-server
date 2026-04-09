import {
  Controller,
  Get,
  Query,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ZohoAuthService } from './core/zoho-auth.service';
import type { ZohoService } from './config/zoho-scope.config';

@Controller('callback')
export class CallbackController {
  constructor(private readonly zohoAuthService: ZohoAuthService) {}

  @Get()
  async handleCallback(
    @Query('code') code?: string,
    @Query('state') service?: ZohoService,
  ) {
    // 🔍 Debug log (remove in production if needed)
    console.log('Zoho Callback:', { code, service });

    // ✅ Validate code
    if (!code) {
      throw new BadRequestException('Authorization code missing');
    }

    // ✅ Validate service
    if (!service) {
      throw new BadRequestException('Service (state) missing');
    }

    const allowedServices: ZohoService[] = ['crm', 'inventory', 'payments'];

    if (!allowedServices.includes(service)) {
      throw new BadRequestException(`Invalid service: ${service}`);
    }

    try {
      // 🔥 Exchange token per service
      const data = await this.zohoAuthService.exchangeCodeForToken(
        code,
        service,
      );

      return {
        success: true,
        message: `Zoho token saved successfully`,
        service,
        expires_in: data.expires_in,
        scope: data.scope, // 👈 useful for debugging
      };
    } catch (error: any) {
      console.error('Zoho Callback Error:', error);

      throw new InternalServerErrorException('Failed to exchange Zoho token');
    }
  }
}
