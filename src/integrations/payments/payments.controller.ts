import { Controller, Post, Body } from '@nestjs/common';
import { OrdersService } from '../../modules/orders/orders.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    console.log('Zoho Webhook:', body);

    const { status, payment_id, amount, metadata } = body;

    const orderId = metadata?.orderId;

    if (!orderId) return { ok: false };

    if (status === 'success') {
      await this.ordersService.handlePaymentSuccess(
        orderId,
        payment_id,
        amount,
      );
    } else {
      await this.ordersService.handlePaymentFailure(orderId);
    }

    return { received: true };
  }
}