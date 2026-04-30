import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PromptPayService } from "./promptpay.service";
import { PaymentSettingsService } from "./payment-settings.service";
import { StripeWebhookController } from "./stripe.webhook.controller";
import { PromptPayController } from "./promptpay.controller";
import { PaymentSettingsController } from "./payment-settings.controller";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [NotificationModule],
  providers: [PaymentService, PromptPayService, PaymentSettingsService],
  controllers: [
    StripeWebhookController,
    PromptPayController,
    PaymentSettingsController,
  ],
  exports: [PaymentService, PromptPayService, PaymentSettingsService],
})
export class PaymentModule {}
