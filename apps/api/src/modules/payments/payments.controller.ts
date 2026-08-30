import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Logger,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CreditCheckoutDto } from './dto/credit-checkout.dto';
import { PaymentProviderRegistry } from './payment-provider.registry';
import { PaymentsService } from './payments.service';
import { CREDIT_SKUS, PLAN_PERIODS, PLAN_PRICES_XOF } from './pricing';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly registry: PaymentProviderRegistry,
    private readonly subscriptions: SubscriptionsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Payment-method picker data. */
  @ApiBearerAuth()
  @Get('providers')
  providers() {
    return { providers: this.payments.listProviders() };
  }

  /** Single source of truth for prices — clients must not hardcode them. */
  @Public()
  @Get('plans')
  plans() {
    return {
      currency: 'XOF',
      periods: PLAN_PERIODS,
      plans: PLAN_PRICES_XOF,
      credits: CREDIT_SKUS,
    };
  }

  @ApiBearerAuth()
  @Get('status')
  status() {
    const enabled = this.registry.enabled();
    return {
      enabled: enabled.length > 0,
      providers: enabled.map((p) => p.name),
    };
  }

  @ApiBearerAuth()
  @Post('checkout')
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.payments.startSubscriptionCheckout(user, dto);
  }

  @ApiBearerAuth()
  @Post('credits/checkout')
  creditCheckout(@CurrentUser() user: AuthUser, @Body() dto: CreditCheckoutDto) {
    return this.payments.startCreditCheckout(user, dto);
  }

  @ApiBearerAuth()
  @Get('me')
  async mine(@CurrentUser() user: AuthUser) {
    return {
      plan: await this.subscriptions.currentPlan(user.id),
      subscriptions: await this.subscriptions.mine(user.id),
    };
  }

  /** Polled by the checkout-return page — the redirect can beat the webhook. */
  @ApiBearerAuth()
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payments.findOne(user.id, id);
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Post('cancel')
  async cancel(@CurrentUser() user: AuthUser) {
    const active = await this.prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!active?.providerRef) throw new BadRequestException('Aucun abonnement actif');
    await this.registry.get(active.provider).cancelSubscription(active.providerRef);
    await this.prisma.subscription.update({
      where: { id: active.id },
      data: { status: 'CANCELED' },
    });
    return { message: "L'abonnement prendra fin à la fin de la période en cours." };
  }

  /**
   * Per-provider webhook. Public (signed, not bearer-authenticated) and reads
   * the raw body — main.ts enables rawBody so HMAC can be checked over the
   * exact bytes. A per-provider path means a misconfigured URL fails loudly
   * instead of silently failing signature verification.
   */
  @Public()
  @HttpCode(200)
  @Post('webhook/:provider')
  async webhook(@Param('provider') name: string, @Req() req: Request) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    const provider = this.registry.get(name);
    // Chariow does not sign its callbacks; its shared secret rides in the URL.
    const signature = provider.webhookSecretInQuery
      ? (req.query?.secret as string | undefined)
      : (req.headers[provider.signatureHeader] as string | undefined);
    if (!raw || !signature) throw new BadRequestException('Signature ou corps manquant');
    const result = await this.payments.ingestWebhook(name, raw, signature);
    this.logger.log(
      `Webhook ${name}: applied=${result.applied} deduped=${result.deduped}`,
    );
    return result;
  }

  /**
   * Legacy Stripe endpoint. Kept so the already-registered dashboard URL keeps
   * working; remove once Stripe points at /payments/webhook/stripe.
   */
  @Public()
  @HttpCode(200)
  @Post('webhook')
  @ApiExcludeEndpoint()
  async legacyWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw || !signature) throw new BadRequestException('Signature ou corps manquant');
    return this.payments.ingestWebhook('stripe', raw, signature);
  }

  /**
   * Expiry sweep + renewal reminders. Driven by an external scheduler (GitHub
   * Actions) because Render's free tier sleeps, so an in-process cron would not
   * fire reliably. Guarded by a shared token, not bearer auth.
   */
  @Public()
  @HttpCode(200)
  @Post('internal/sweep')
  @ApiExcludeEndpoint()
  async sweep(@Headers('x-internal-token') token: string) {
    const expected = this.config.get<string>('INTERNAL_CRON_TOKEN');
    if (!expected || token !== expected) throw new ForbiddenException();
    return this.subscriptions.sweepExpiries();
  }

  /**
   * Pull-based reconciliation for hosted checkouts. Same external scheduler as
   * the sweep; run it more often (every few minutes) because it is what
   * catches a sale whose webhook never arrived.
   */
  @Public()
  @HttpCode(200)
  @Post('internal/reconcile')
  @ApiExcludeEndpoint()
  async reconcile(@Headers('x-internal-token') token: string) {
    const expected = this.config.get<string>('INTERNAL_CRON_TOKEN');
    if (!expected || token !== expected) throw new ForbiddenException();
    return this.payments.reconcilePending();
  }
}
