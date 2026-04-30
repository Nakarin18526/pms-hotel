import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { IsEmail, IsEnum, IsISO8601, IsOptional, IsString } from "class-validator";
import { JwtService } from "@nestjs/jwt";
import { BookingService } from "./booking.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

class CreateBookingDto {
  @IsString() roomTypeId!: string;
  @IsISO8601() checkIn!: string;
  @IsISO8601() checkOut!: string;
  @IsString() guestName!: string;
  @IsString() guestPhone!: string;
  @IsEmail() guestEmail!: string;
  @IsOptional() @IsEnum(["STRIPE", "PROMPTPAY"])
  paymentMethod?: "STRIPE" | "PROMPTPAY";
}

@Controller("bookings")
export class BookingController {
  constructor(
    private readonly svc: BookingService,
    private readonly jwt: JwtService,
  ) {}

  // Public booking creation. Accepts optional auth so we can attach guestId.
  @Post()
  async create(@Body() dto: CreateBookingDto, @Req() req: any) {
    let guestId: string | undefined;
    const auth = req.headers["authorization"];
    if (auth?.startsWith("Bearer ")) {
      try {
        const decoded: any = this.jwt.verify(auth.slice(7));
        if (decoded?.role === "GUEST") guestId = decoded.sub;
      } catch {
        /* ignore — anonymous booking is allowed */
      }
    }
    return this.svc.createGuestBooking({ ...dto, guestId });
  }

  // NOTE: more specific routes must be declared before :id
  @UseGuards(JwtAuthGuard)
  @Get("guest/me")
  myBookings(@Req() req: any) {
    return this.svc.listByGuest(req.user.sub);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.svc.getById(id);
  }

  /**
   * Dev-only fallback used when Stripe isn't configured. Idempotently
   * confirms a booking via its stored stripeSessionId. Disabled in prod.
   */
  @Post(":id/dev-confirm")
  async devConfirm(@Param("id") id: string) {
    if (process.env.NODE_ENV === "production")
      throw new Error("disabled in production");
    const booking = await this.svc.getById(id);
    if (!booking.stripeSessionId)
      throw new Error("no stripe session attached");
    return this.svc.confirmFromStripeSession(booking.stripeSessionId);
  }
}
