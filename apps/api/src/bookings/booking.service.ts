import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AvailabilityService } from "../availability/availability.service";
import { RateCalendarService } from "../rate-calendar/rate-calendar.service";
import { PaymentService } from "../payment/payment.service";
import { NotificationService } from "../notification/notification.service";
import { differenceInCalendarDays } from "date-fns";
import { parseDate } from "../common/dates";
import type { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";

export interface CreateBookingArgs {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestId?: string | null;
  paymentMethod?: "STRIPE" | "PROMPTPAY";
}

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private availability: AvailabilityService,
    private rates: RateCalendarService,
    private payment: PaymentService,
    private notification: NotificationService,
  ) {}

  async createGuestBooking(args: CreateBookingArgs) {
    const checkIn = parseDate(args.checkIn);
    const checkOut = parseDate(args.checkOut);
    if (checkOut <= checkIn)
      throw new BadRequestException("checkOut must be after checkIn");

    const { availableUnits } = await this.availability.availableUnits(
      args.roomTypeId,
      checkIn,
      checkOut,
    );
    if (availableUnits < 1) throw new ConflictException("No availability");

    const rates = await this.rates.getRatesForBookingRange(
      args.roomTypeId,
      checkIn,
      checkOut,
    );
    const total = rates.reduce((s, r) => s + r.price, 0);

    const method = args.paymentMethod ?? "STRIPE";

    const booking = await this.prisma.booking.create({
      data: {
        roomTypeId: args.roomTypeId,
        guestId: args.guestId ?? null,
        checkIn,
        checkOut,
        totalPrice: total,
        guestName: args.guestName,
        guestPhone: args.guestPhone,
        guestEmail: args.guestEmail,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod: method,
      },
    });

    if (method === "PROMPTPAY") {
      // Guest will be redirected to /booking/:id/promptpay to scan QR + upload slip
      const webUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      return {
        bookingId: booking.id,
        checkoutUrl: `${webUrl}/booking/${booking.id}/promptpay`,
        sessionId: null,
      };
    }

    const session = await this.payment.createCheckoutSession({
      bookingId: booking.id,
      amount: total,
      guestEmail: args.guestEmail,
      description: `Booking ${booking.id}`,
    });

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.id },
    });

    return {
      bookingId: booking.id,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  /**
   * Idempotent: marks the booking PAID + CONFIRMED based on stripe session id.
   * Safe to call multiple times — second call returns existing state.
   */
  async confirmFromStripeSession(sessionId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { stripeSessionId: sessionId },
      include: { roomType: true },
    });
    if (!booking) return null;
    if (booking.paymentStatus === "PAID" && booking.status === "CONFIRMED") {
      return booking;
    }
    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
      include: { roomType: true },
    });
    await this.notification.sendBookingConfirmed(updated);
    return updated;
  }

  async getById(id: string) {
    const b = await this.prisma.booking.findUnique({
      where: { id },
      include: { roomType: true },
    });
    if (!b) throw new NotFoundException("Booking not found");
    return b;
  }

  async listByGuest(guestId: string) {
    return this.prisma.booking.findMany({
      where: { guestId },
      include: { roomType: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async cancel(id: string) {
    const b = await this.getById(id);
    if (b.status === "CANCELLED") return b;
    return this.prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { roomType: true },
    });
  }

  /**
   * Admin marks the guest as checked out.
   * - Status flips to CHECKED_OUT — room is immediately freed from inventory
   *   (availability only counts CONFIRMED bookings).
   * - Refunds are NOT issued (PRD: all sales final).
   * - Original totalPrice + checkOut date are preserved as historical record.
   */
  async checkOut(id: string, adminId?: string) {
    const b = await this.getById(id);
    if (b.status === "CANCELLED")
      throw new BadRequestException("Cannot check out a cancelled booking");
    if (b.status === "CHECKED_OUT") return b; // idempotent
    if (b.status !== "CONFIRMED")
      throw new BadRequestException(
        "Only CONFIRMED bookings can be checked out",
      );
    return this.prisma.booking.update({
      where: { id },
      data: {
        status: "CHECKED_OUT",
        checkedOutAt: new Date(),
        checkedOutBy: adminId ?? null,
      },
      include: { roomType: true },
    });
  }

  async update(
    id: string,
    data: {
      checkIn?: string;
      checkOut?: string;
      roomTypeId?: string;
      guestName?: string;
      guestPhone?: string;
      roomNumber?: string | null;
    },
  ) {
    const existing = await this.getById(id);

    const newCheckIn = data.checkIn
      ? parseDate(data.checkIn)
      : existing.checkIn;
    const newCheckOut = data.checkOut
      ? parseDate(data.checkOut)
      : existing.checkOut;
    const newRoomType = data.roomTypeId ?? existing.roomTypeId;

    if (newCheckOut <= newCheckIn)
      throw new BadRequestException("checkOut must be > checkIn");

    if (
      data.checkIn ||
      data.checkOut ||
      data.roomTypeId
    ) {
      // re-check availability excluding self
      const { availableUnits } = await this.availability.availableUnits(
        newRoomType,
        newCheckIn,
        newCheckOut,
        id,
      );
      if (availableUnits < 1 && existing.status === "CONFIRMED")
        throw new ConflictException("No availability for new dates/room");
    }

    let newTotal: number | undefined;
    if (data.checkIn || data.checkOut || data.roomTypeId) {
      const rates = await this.rates.getRatesForBookingRange(
        newRoomType,
        newCheckIn,
        newCheckOut,
      );
      newTotal = rates.reduce((s, r) => s + r.price, 0);
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        roomTypeId: newRoomType,
        guestName: data.guestName ?? existing.guestName,
        guestPhone: data.guestPhone ?? existing.guestPhone,
        ...(data.roomNumber !== undefined
          ? { roomNumber: data.roomNumber?.trim() || null }
          : {}),
        ...(newTotal !== undefined ? { totalPrice: newTotal } : {}),
      },
      include: { roomType: true },
    });
  }

  async adminCreate(data: {
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    status?: BookingStatus;
    paymentStatus?: PaymentStatus;
  }) {
    const checkIn = parseDate(data.checkIn);
    const checkOut = parseDate(data.checkOut);
    if (checkOut <= checkIn) throw new BadRequestException("invalid range");

    const { availableUnits } = await this.availability.availableUnits(
      data.roomTypeId,
      checkIn,
      checkOut,
    );
    const status = data.status ?? "CONFIRMED";
    if (status === "CONFIRMED" && availableUnits < 1)
      throw new ConflictException("No availability");

    const rates = await this.rates.getRatesForBookingRange(
      data.roomTypeId,
      checkIn,
      checkOut,
    );
    const total = rates.reduce((s, r) => s + r.price, 0);

    return this.prisma.booking.create({
      data: {
        roomTypeId: data.roomTypeId,
        checkIn,
        checkOut,
        totalPrice: total,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail,
        status,
        paymentStatus: data.paymentStatus ?? "UNPAID",
      },
      include: { roomType: true },
    });
  }

  async markPaid(id: string) {
    await this.getById(id);
    return this.prisma.booking.update({
      where: { id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
      include: { roomType: true },
    });
  }

  async adminList(filter: {
    status?: BookingStatus;
    checkInFrom?: string;
    checkInTo?: string;
    /** Free-text search across roomNumber, guestName, guestEmail, booking id */
    q?: string;
  }) {
    const where: Prisma.BookingWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.checkInFrom || filter.checkInTo) {
      where.checkIn = {};
      if (filter.checkInFrom)
        (where.checkIn as any).gte = parseDate(filter.checkInFrom);
      if (filter.checkInTo)
        (where.checkIn as any).lte = parseDate(filter.checkInTo);
    }
    if (filter.q?.trim()) {
      const q = filter.q.trim();
      where.OR = [
        { roomNumber: { contains: q, mode: "insensitive" } },
        { guestName: { contains: q, mode: "insensitive" } },
        { guestEmail: { contains: q, mode: "insensitive" } },
        { id: { contains: q } },
      ];
    }
    return this.prisma.booking.findMany({
      where,
      include: { roomType: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
