import { Module } from '@nestjs/common';
import { CreditsModule } from '../credits/credits.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BictorysProvider } from './bictorys.provider';
import { ChariowProvider } from './chariow.provider';
import { MonerooProvider } from './moneroo.provider';
import { PAYMENT_PROVIDERS } from './payment-provider.interface';
import { PaymentProviderRegistry } from './payment-provider.registry';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeProvider } from './stripe.provider';

@Module({
  imports: [SubscriptionsModule, CreditsModule],
  controllers: [PaymentsController],
  providers: [
    StripeProvider,
    MonerooProvider,
    ChariowProvider,
    BictorysProvider,
    {
      // Register every adapter here; the registry picks one per request.
      provide: PAYMENT_PROVIDERS,
      useFactory: (
        stripe: StripeProvider,
        moneroo: MonerooProvider,
        chariow: ChariowProvider,
        bictorys: BictorysProvider,
      ) => [stripe, moneroo, chariow, bictorys],
      inject: [StripeProvider, MonerooProvider, ChariowProvider, BictorysProvider],
    },
    PaymentProviderRegistry,
    PaymentsService,
  ],
  exports: [PaymentProviderRegistry, PaymentsService],
})
export class PaymentsModule {}
