import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { IsISO8601, IsNumber, Min } from "class-validator";
import { RateCalendarService } from "./rate-calendar.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { SuperAdminGuard } from "../auth/super-admin.guard";

class SetRangeDto {
  @IsISO8601() startDate!: string;
  @IsISO8601() endDate!: string;
  @IsNumber() @Min(0) price!: number;
}

@Controller()
export class RateCalendarController {
  constructor(private readonly svc: RateCalendarService) {}

  @Get("room-types/:id/rates")
  range(
    @Param("id") id: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.svc.getRange(id, startDate, endDate);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, SuperAdminGuard)
  @Roles("ADMIN")
  @Put("admin/room-types/:id/rates")
  setRange(@Param("id") id: string, @Body() dto: SetRangeDto) {
    return this.svc.setRange(id, dto.startDate, dto.endDate, dto.price);
  }
}
