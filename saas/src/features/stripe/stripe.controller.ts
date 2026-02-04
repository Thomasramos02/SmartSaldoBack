import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  Res,
  Get,
  Query,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { UsersService } from '../users/users.services';
import type { Request, Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 🔹 Inicia checkout de assinatura (mensal ou anual)
   */
  @UseGuards(AuthGuard)
  @Post('subscribe')
  async subscribe(
    @Req() req: Request & { user: any },
    @Body('plan') plan: 'monthly' | 'yearly',
  ) {
    const user = req.user;

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      throw new Error('Invalid plan');
    }

    const priceId =
      plan === 'yearly'
        ? process.env.STRIPE_PRICE_PREMIUM_YEARLY
        : process.env.STRIPE_PRICE_PREMIUM_MONTHLY;

    if (!priceId) {
      throw new Error('Stripe priceId not configured');
    }

    // Cria customer se não existir
    if (!user.stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(user.email);
      await this.usersService.saveStripeCustomerId(user.id, customer.id);
      user.stripeCustomerId = customer.id;
    }

    // Cria sessão de checkout de ASSINATURA
    const baseSuccessUrl = process.env.STRIPE_SUCCESS_URL!;
    const successUrl = baseSuccessUrl.includes('{CHECKOUT_SESSION_ID}')
      ? baseSuccessUrl
      : `${baseSuccessUrl}${baseSuccessUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`;
    const session = await this.stripeService.createSubscriptionCheckoutSession(
      user.stripeCustomerId,
      priceId,
      successUrl,
      process.env.STRIPE_CANCEL_URL!,
    );

    return { url: session.url };
  }

  /**
   * 🔔 Webhook da Stripe (FONTE DA VERDADE)
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let event;

    try {
      const payload = req.body as Buffer;
      if (!Buffer.isBuffer(payload)) {
        return res.status(400).send('Webhook Error: invalid payload');
      }
      event = await this.stripeService.constructWebhookEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err: any) {
      console.error('Webhook error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      /**
       * ✅ Checkout concluído (assinatura criada)
       */
      case 'checkout.session.completed': {
        const session = event.data.object as {
          customer?: string;
          mode?: string;
          payment_status?: string;
        };
        if (session.mode === 'subscription' && session.customer) {
          await this.usersService.setPremiumByCustomerId(session.customer);
        }
        break;
      }

      /**
       * ✅ Pagamento aprovado (mensal ou anual)
       */
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await this.usersService.setPremiumByCustomerId(
          invoice.customer as string,
        );
        break;
      }

      /**
       * ✅ Assinatura ativa/atualizada
       */
      case 'customer.subscription.updated': {
        const subscription = event.data.object as {
          customer?: string;
          status?: string;
        };
        if (subscription.customer && subscription.status === 'active') {
          await this.usersService.setPremiumByCustomerId(subscription.customer);
        }
        if (
          subscription.customer &&
          subscription.status &&
          ['canceled', 'unpaid', 'past_due', 'incomplete_expired'].includes(
            subscription.status,
          )
        ) {
          await this.usersService.setFreeByCustomerId(subscription.customer);
        }
        break;
      }

      /**
       * ❌ Pagamento falhou (inadimplência)
       */
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await this.usersService.setFreeByCustomerId(invoice.customer as string);
        break;
      }

      /**
       * ❌ Assinatura cancelada
       */
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await this.usersService.setFreeByCustomerId(
          subscription.customer as string,
        );
        break;
      }

      default:
        // eventos ignorados
        break;
    }

    return res.json({ received: true });
  }

  /**
   * ✅ Confirma assinatura após redirect do Checkout
   */
  @UseGuards(AuthGuard)
  @Get('confirm')
  async confirmSubscription(
    @Req() req: Request & { user: any },
    @Query('session_id') sessionId?: string,
  ) {
    if (!sessionId) {
      throw new BadRequestException('session_id é obrigatório');
    }

    const user = await this.usersService.findOne(req.user.id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    if (!user.stripeCustomerId) {
      throw new BadRequestException('Usuário não possui stripeCustomerId');
    }

    const session = await this.stripeService.retrieveCheckoutSession(sessionId);
    if (!session.customer || session.customer !== user.stripeCustomerId) {
      throw new ForbiddenException('Sessão não pertence ao usuário');
    }

    if (
      session.mode === 'subscription' &&
      (session.payment_status === 'paid' || session.status === 'complete')
    ) {
      await this.usersService.setPremiumByCustomerId(user.stripeCustomerId);
      return { status: 'premium' };
    }

    return { status: 'pending' };
  }
}
