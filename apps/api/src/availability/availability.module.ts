import { Module } from "@nestjs/common";
import { AvailabilityService } from "./availability.service";
import { AvailabilityController } from "./availability.controller";
import { RateCalendarModule } from "../rate-calendar/rate-calendar.module";

@Module({
  imports: [RateCalendarModule],
  providers: [AvailabilityService],
  controllers: [AvailabilityController],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
