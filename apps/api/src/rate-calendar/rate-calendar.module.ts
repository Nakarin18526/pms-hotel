import { Module } from "@nestjs/common";
import { RateCalendarService } from "./rate-calendar.service";
import { RateCalendarController } from "./rate-calendar.controller";

@Module({
  providers: [RateCalendarService],
  controllers: [RateCalendarController],
  exports: [RateCalendarService],
})
export class RateCalendarModule {}
