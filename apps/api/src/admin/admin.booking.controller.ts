import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
} from "class-validator";
import { BookingService } from "../bookings/booking.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { BookingStatus, PaymentStatus } from "@prisma/client";

class AdminCreateDto {
  @IsString() roomTypeId!: string;
  @IsISO8601() checkIn!: string;
  @IsISO8601() checkOut!: string;
  @IsString() guestName!: string;
  @IsString() guestPhone!: string;
  @IsEmail() guestEmail!: string;
  @IsOptional() @IsEnum(BookingStatus) status?: BookingStatus;
  @IsOptional() @IsEnum(PaymentStatus) paymentStatus?: PaymentStatus;
}

class AdminUpdateDto {
  @IsOptional() @IsISO8601() checkIn?: string;
  @IsOptional() @IsISO8601() checkOut?: string;
  @IsOptional() @IsString() roomTypeId?: string;
  @IsOptional() @IsString() guestName?: string;
  @IsOptional() @IsString() guestPhone?: string;
  @IsOptional() @IsString() roomNumber?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/bookings")
export class AdminBookingController {
  constructor(private readonly bookings: BookingService) {}

  @Get()
  list(
    @Query("status") status?: BookingStatus,
    @Query("checkInFrom") checkInFrom?: string,
    @Query("checkInTo") checkInTo?: string,
    @Query("q") q?: string,
  ) {
    return this.bookings.adminList({ status, checkInFrom, checkInTo, q });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.bookings.getById(id);
  }

  @Post()
  create(@Body() dto: AdminCreateDto) {
    return this.bookings.adminCreate(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: AdminUpdateDto) {
    return this.bookings.update(id, dto);
  }

  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.bookings.cancel(id);
  }

  @Post(":id/mark-paid")
  markPaid(@Param("id") id: string) {
    return this.bookings.markPaid(id);
  }

  @Post(":id/check-out")
  checkOut(@Param("id") id: string, @Req() req: any) {
    return this.bookings.checkOut(id, req.user?.sub);
  }
}
