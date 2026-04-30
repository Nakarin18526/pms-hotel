import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RateCalendarService } from "../rate-calendar/rate-calendar.service";
import { differenceInCalendarDays } from "date-fns";
import { parseDate } from "../common/dates";
import type { AvailabilityRoomTypeResult } from "@pms/types";

@Injectable()
export class AvailabilityService {
  constructor(
    private prisma: PrismaService,
    private rates: RateCalendarService,
  ) {}

  /**
   * Number of available units for a roomType across the date range.
   * Range semantics: checkIn inclusive, checkOut exclusive.
   *
   * availableUnits = totalUnits - confirmedBookingsOverlap
   * Overlap condition: booking.checkIn < range.checkOut AND booking.checkOut > range.checkIn
   * Bookings touching back-to-back (booking.checkOut == range.checkIn) DO NOT overlap.
   */
  async availableUnits(
    roomTypeId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string,
  ): Promise<{ totalUnits: number; availableUnits: number }> {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId },
    });
    if (!roomType) throw new BadRequestException("Room type not found");

    const overlapping = await this.prisma.booking.count({
      where: {
        roomTypeId,
        status: "CONFIRMED",
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
        ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
      },
    });

    return {
      totalUnits: roomType.totalUnits,
      availableUnits: Math.max(roomType.totalUnits - overlapping, 0),
    };
  }

  /**
   * Search across all room types and return availability + total price for the
   * given range (used by direct booking page).
   */
  async searchAll(
    checkIn: string,
    checkOut: string,
  ): Promise<AvailabilityRoomTypeResult[]> {
    const ci = parseDate(checkIn);
    const co = parseDate(checkOut);
    if (co <= ci) throw new BadRequestException("checkOut must be > checkIn");
    const nights = differenceInCalendarDays(co, ci);

    const roomTypes = await this.prisma.roomType.findMany({
      orderBy: { createdAt: "asc" },
    });

    const results: AvailabilityRoomTypeResult[] = [];
    for (const rt of roomTypes) {
      const { totalUnits, availableUnits } = await this.availableUnits(
        rt.id,
        ci,
        co,
      );

      let perNight: { date: string; price: number }[] = [];
      let totalPrice = 0;
      let unavailableReason: AvailabilityRoomTypeResult["unavailableReason"];
      try {
        perNight = await this.rates.getRatesForBookingRange(rt.id, ci, co);
        totalPrice = perNight.reduce((s, r) => s + r.price, 0);
      } catch {
        unavailableReason = "NO_RATES";
      }

      if (!unavailableReason && availableUnits < 1) {
        unavailableReason = "FULLY_BOOKED";
      }

      results.push({
        roomTypeId: rt.id,
        name: rt.name,
        description: rt.description,
        maxOccupancy: rt.maxOccupancy,
        imageUrls: rt.imageUrls,
        totalUnits,
        availableUnits,
        available: !unavailableReason,
        totalPrice,
        nights,
        pricePerNight: perNight,
        unavailableReason,
      });
    }
    return results;
  }
}
