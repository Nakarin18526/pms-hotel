import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import Stripe from "stripe";

/**
 * Stripe enforces a per-currency minimum charge amount. Below this,
 * Stripe rejects the Checkout Session creation. We pre-validate so guests
 * see a friendly message instead of a raw API error.
 *
 * Source: https://docs.stripe.com/currencies#minimum-and-maximum-charge-amounts
 */
const STRIPE_MIN_CHARGE: Record<string, number> = {
  thb: 10,
  usd: 0.5,
  eur: 0.5,
  gbp: 0.3,
  jpy: 50,
  sgd: 0.5,
  aud: 0.5,
  hkd: 4,
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly stripe: Stripe | null;
  private readonly currency: string;
  private readonly webUrl: string;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    this.currency = (process.env.CURRENCY ?? "THB").toLowerCase();
    this.webUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    // Treat placeholder values from .env.example as "not configured"
    const isRealKey =
      !!key && /^sk_(test|live)_[A-Za-z0-9]{16,}$/.test(key);
    this.stripe = isRealKey
      ? new Stripe(key!, { apiVersion: "2024-04-10" as any })
      : null;
    if (!this.stripe) {
      this.logger.warn(
        key
          ? `STRIPE_SECRET_KEY looks like a placeholder ("${key.slice(0, 12)}…") — using dev-checkout stub`
          : "STRIPE_SECRET_KEY missing — using dev-checkout stub",
      );
    }
  }

  async createCheckoutSession(args: {
    bookingId: string;
    amount: number;
    guestEmail: string;
    description: string;
  }): Promise<{ id: string; url: string }> {
    if (!this.stripe) {
      // Dev fallback: return a fake session so the UI flow can complete
      const fakeId = `cs_test_dev_${args.bookingId}`;
      return {
        id: fakeId,
        url: `${this.webUrl}/booking/${args.bookingId}/dev-checkout?session_id=${fakeId}`,
      };
    }

    // Validate against Stripe's per-currency minimum BEFORE calling the API
    // so guests get a clear message + can fall back to PromptPay/cash.
    const min = STRIPE_MIN_CHARGE[this.currency];
    if (min !== undefined && args.amount < min) {
      throw new BadRequestException(
        `ยอดต่ำกว่าขั้นต่ำของ Stripe (${min} ${this.currency.toUpperCase()}) — กรุณาเลือก "โอนเงิน / QR" แทน หรือเพิ่มราคาห้อง`,
      );
    }

    // Stripe expects integer amount in smallest currency unit
    const unitAmount = Math.round(args.amount * 100);
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: args.guestEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: this.currency,
            unit_amount: unitAmount,
            product_data: {
              name: "Hotel Booking",
              description: args.description,
            },
          },
        },
      ],
      metadata: { bookingId: args.bookingId },
      success_url: `${this.webUrl}/booking/${args.bookingId}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.webUrl}/book?canceled=1`,
    });
    return { id: session.id, url: session.url ?? "" };
  }

  verifyWebhook(rawBody: Buffer, signature: string): Stripe.Event {
    if (!this.stripe) throw new Error("Stripe not configured");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }
}
