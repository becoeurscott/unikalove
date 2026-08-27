import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PAYMENT_PROVIDER, PaymentProvider } from './payment-provider.interface';
import { CheckoutDto } from './dto/checkout.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly subscriptions: SubscriptionsService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiBearerAuth()
  @Get('status')
  status() {
    return { provider: this.provider.name, enabled: this.provider.enabled };
  }

  @ApiBearerAuth()
  @Post('checkout')
  async checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.provider.createCheckout(user.id, user.email, dto.plan);
  }

  @ApiBearerAuth()
  @Get('me')
  async mine(@CurrentUser() user: AuthUser) {
    return {
      plan: await this.subscriptions.currentPlan(user.id),
      subscriptions: await this.subscriptions.mine(user.id),
    };
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
    await this.provider.cancelSubscription(active.providerRef);
    return { message: "L'abonnement prendra fin à la fin de la période en cours." };
  }

  /**
   * Provider webhook. Public (signed, not bearer-authenticated) and reads the
   * raw body — main.ts enables rawBody so the signature can be verified.
   */
  @Public()
  @HttpCode(200)
  @Post('webhook')
  async webhook(@Req() req: Request, @Headers('stripe-signature') signature: string) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw || !signature) throw new BadRequestException('Signature ou corps manquant');
    const events = await this.provider.handleWebhook(raw, signature);
    for (const event of events) {
      await this.subscriptions.applyEvent(event, this.provider.name);
      this.logger.log(`Applied ${event.type} for user ${event.userId}`);
    }
    return { received: true };
  }
}
