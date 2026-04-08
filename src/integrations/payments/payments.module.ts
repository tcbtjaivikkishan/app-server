import { Module } from '@nestjs/common';
import { ZohoPaymentGatewayService } from './zoho-payment-gateway.service';
import { ZohoModule } from '../../zoho/zoho.module';

@Module({
    imports: [
        ZohoModule,
    ],
    providers: [ZohoPaymentGatewayService],
    exports: [ZohoPaymentGatewayService],
})
export class PaymentsModule { }