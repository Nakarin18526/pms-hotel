import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { RoomTypeModule } from "./room-types/room-type.module";
import { RateCalendarModule } from "./rate-calendar/rate-calendar.module";
import { AvailabilityModule } from "./availability/availability.module";
import { BookingModule } from "./bookings/booking.module";
import { PaymentModule } from "./payment/payment.module";
import { NotificationModule } from "./notification/notification.module";
import { AdminModule } from "./admin/admin.module";
import { UploadsModule } from "./uploads/uploads.module";
import { SiteSettingsModule } from "./site-settings/site-settings.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RoomTypeModule,
    RateCalendarModule,
    AvailabilityModule,
    BookingModule,
    PaymentModule,
    NotificationModule,
    AdminModule,
    UploadsModule,
    SiteSettingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
