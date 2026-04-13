import { Module } from '@nestjs/common';
import { ZohoPaymentGatewayService } from './zoho-payment-gateway.service';
import { ZohoModule } from '../../zoho/zoho.module';
import { ZohoPaymentsModule } from '../../zoho/payments/payments.module';

@Module({
    imports: [
        ZohoModule,
        ZohoPaymentsModule
    ],
    providers: [ZohoPaymentGatewayService],
    exports: [ZohoPaymentGatewayService],
})
export class PaymentsModule { }