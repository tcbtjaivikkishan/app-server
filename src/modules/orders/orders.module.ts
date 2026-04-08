import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './schemas/order.schema';
import { PaymentsController } from '../../integrations/payments/payments.controller';
import { PaymentsModule } from '../../integrations/payments/payments.module';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    PaymentsModule,
  ],
  controllers: [OrdersController, PaymentsController],
  providers: [OrdersService],
})
export class OrdersModule { }