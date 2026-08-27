import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PAYMENT_PROVIDERS, PaymentProvider } from './payment-provider.interface';

/**
 * Resolves which adapter handles a given checkout or webhook. Replaces the
 * single PAYMENT_PROVIDER binding so Stripe (cards, recurring) and Moneroo
 * (mobile money, one-shot) can coexist.
 */
@Injectable()
export class PaymentProviderRegistry {
  constructor(
    @Inject(PAYMENT_PROVIDERS) private readonly all: PaymentProvider[],
  ) {}

  /** Enabled provider by name, or a 400 the frontend can show as-is. */
  get(name: string): PaymentProvider {
    const provider = this.all.find((p) => p.name === name);
    if (!provider) throw new BadRequestException(`Moyen de paiement inconnu : ${name}`);
    if (!provider.enabled) {
      throw new BadRequestException(
        `Le moyen de paiement « ${provider.label} » n'est pas disponible.`,
      );
    }
    return provider;
  }

  enabled(): PaymentProvider[] {
    return this.all.filter((p) => p.enabled);
  }

  /** Default provider for a currency — XOF/XAF go to mobile money. */
  defaultFor(currency: string): PaymentProvider {
    const match = this.enabled().find((p) => p.currencies.includes(currency));
    if (!match) {
      throw new BadRequestException(`Aucun moyen de paiement pour la devise ${currency}`);
    }
    return match;
  }
}
