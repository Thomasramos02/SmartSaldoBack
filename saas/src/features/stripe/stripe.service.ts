import { Injectable, Inject } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(@Inject('STRIPE_CLIENT') stripeClient: Stripe) {
    this.stripe = stripeClient;
  }
  async createSubscriptionCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async retrieveCheckoutSession(sessionId: string) {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
    secret: string,
  ) {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  async createCustomer(email: string) {
    return this.stripe.customers.create({ email });
  }
}
