import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe = require('stripe');
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class PaymentService {
  private _stripe: Stripe | null = null;

  constructor(
    private config: ConfigService,
    private subscriptionService: SubscriptionService,
  ) {}

  private get stripe(): Stripe {
    if (!this._stripe) {
      const key = this.config.get<string>('STRIPE_SECRET_KEY', '');
      if (!key) throw new BadRequestException('Stripe no configurado (STRIPE_SECRET_KEY ausente)');
      this._stripe = new Stripe(key, { apiVersion: '2026-05-27.dahlia' });
    }
    return this._stripe;
  }

  async createCheckoutSession(weddingId: string, userId: string): Promise<string> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'KissthePlan — Plan anual', description: 'Acceso completo durante 1 año' },
            unit_amount: 7000,
          },
          quantity: 1,
        },
      ],
      metadata: { weddingId, userId },
      success_url: `${frontendUrl}/app/account?payment=success`,
      cancel_url: `${frontendUrl}/app/account?payment=cancelled`,
    });

    if (!session.url) throw new BadRequestException('No se pudo crear la sesión de pago');
    return session.url;
  }

  async createPortalSession(stripeCustomerId: string): Promise<string> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const session = await this.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${frontendUrl}/app/account`,
    });
    return session.url;
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');
    console.log('[stripe-webhook] hit. hasSignature:', !!signature, 'bodyLength:', rawBody?.length);
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('[stripe-webhook] signature verification FAILED:', (err as Error).message);
      throw new BadRequestException('Webhook signature inválida');
    }

    console.log('[stripe-webhook] event verified. type:', event.type, 'id:', event.id);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const weddingId = session.metadata?.weddingId;
      const userId = session.metadata?.userId;
      const stripeSessionId = session.id;

      console.log('[stripe-webhook] checkout.session.completed. metadata:', { weddingId, userId, stripeSessionId });

      if (weddingId && userId) {
        await this.subscriptionService.activate(weddingId, userId, stripeSessionId);
        console.log('[stripe-webhook] subscription activated for weddingId:', weddingId);
      } else {
        console.error('[stripe-webhook] MISSING metadata weddingId/userId in session:', session.id);
      }
    }
  }
}
