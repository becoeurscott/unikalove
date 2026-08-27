import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PAYMENT_PROVIDER } from './payment-provider.interface';
import { PaymentsController } from './payments.controller';
import { StripeProvider } from './stripe.provider';

@Module({
  imports: [SubscriptionsModule],
  controllers: [PaymentsController],
  providers: [{ provide: PAYMENT_PROVIDER, useClass: StripeProvider }],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentsModule {}
