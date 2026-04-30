import { Module } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { BookingController } from "./booking.controller";
import { AvailabilityModule } from "../availability/availability.module";
import { RateCalendarModule } from "../rate-calendar/rate-calendar.module";
import { PaymentModule } from "../payment/payment.module";
import { NotificationModule } from "../notification/notification.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule,
    AvailabilityModule,
    RateCalendarModule,
    PaymentModule,
    NotificationModule,
  ],
  providers: [BookingService],
  controllers: [BookingController],
  exports: [BookingService],
})
export class BookingModule {}
