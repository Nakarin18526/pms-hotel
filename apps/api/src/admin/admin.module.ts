import { Module } from "@nestjs/common";
import { BookingModule } from "../bookings/booking.module";
import { AdminBookingController } from "./admin.booking.controller";
import { AdminsService } from "./admins.service";
import { AdminsController } from "./admins.controller";

@Module({
  imports: [BookingModule],
  providers: [AdminsService],
  controllers: [AdminBookingController, AdminsController],
})
export class AdminModule {}
