import {
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { PaymentService } from "./payment.service";
import { BookingService } from "../bookings/booking.service";
import { ModuleRef } from "@nestjs/core";

@Controller("webhooks/stripe")
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly payment: PaymentService,
    private readonly moduleRef: ModuleRef,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Req() req: Request,
    @Headers("stripe-signature") sig: string,
  ) {
    if (!sig) {
      this.logger.warn("Missing stripe-signature header");
      return { received: false };
    }

    const raw = (req as any).rawBody as Buffer | undefined;
    if (!raw) {
      this.logger.error("rawBody missing — check main.ts raw parser");
      return { received: false };
    }

    let event;
    try {
      event = this.payment.verifyWebhook(raw, sig);
    } catch (err: any) {
      this.logger.error(`Webhook verification failed: ${err.message}`);
      return { received: false };
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as { id: string };
      const bookings = this.moduleRef.get(BookingService, { strict: false });
      await bookings.confirmFromStripeSession(session.id);
    }
    return { received: true };
  }
}
