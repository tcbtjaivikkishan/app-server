import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { ProductsService } from '../products/products.service';

@Controller('zoho')
export class ZohoWebhookController {
  constructor(private readonly productsService: ProductsService) {}

  // Zoho will POST to: https://your-domain.com/zoho/webhook
  @Post('webhook')
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-zoho-webhook-token') webhookToken: string,
  ) {
    // Verify secret token if set in .env
    const expectedToken = process.env.ZOHO_WEBHOOK_SECRET;
    if (expectedToken && webhookToken !== expectedToken) {
      throw new UnauthorizedException('Invalid webhook token');
    }

    console.log('Zoho webhook received:', JSON.stringify(payload));

    // Return 200 immediately — process in background
    // so Zoho doesn't retry thinking the request failed
    this.productsService.handleZohoWebhook(payload).catch(err =>
      console.error('Webhook processing error:', err),
    );

    return { received: true };
  }
}