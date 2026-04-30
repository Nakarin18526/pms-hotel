import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  addDaysUTC,
  eachDayUTC,
  formatDate,
  parseDate,
} from "../common/dates";

@Injectable()
export class RateCalendarService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns rates for a room type within an inclusive date range [startDate, endDate].
   */
  async getRange(roomTypeId: string, startDate: string, endDate: string) {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (end < start) throw new BadRequestException("endDate < startDate");

    const rates = await this.prisma.roomRate.findMany({
      where: { roomTypeId, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    });
    return rates.map((r) => ({
      id: r.id,
      roomTypeId: r.roomTypeId,
      date: formatDate(r.date),
      price: Number(r.price),
    }));
  }

  /**
   * Bulk set rates over [startDate, endDate] inclusive at a fixed price per night.
   */
  async setRange(
    roomTypeId: string,
    startDate: string,
    endDate: string,
    price: number,
  ) {
    if (price < 0) throw new BadRequestException("price must be >= 0");
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (end < start) throw new BadRequestException("endDate < startDate");

    const days = eachDayUTC(start, end);
    const ops = days.map((d) =>
      this.prisma.roomRate.upsert({
        where: { roomTypeId_date: { roomTypeId, date: d } },
        update: { price },
        create: { roomTypeId, date: d, price },
      }),
    );
    await this.prisma.$transaction(ops);
    return { updated: days.length };
  }

  /**
   * Returns the per-night rates for the booking range [checkIn, checkOut).
   * Throws if any night has no rate set (block the booking).
   */
  async getRatesForBookingRange(
    roomTypeId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<{ date: string; price: number }[]> {
    // Normalize to UTC midnight in case caller passed a local-midnight Date
    const start = parseDate(formatDate(checkIn));
    const end = parseDate(formatDate(checkOut));
    if (end <= start)
      throw new BadRequestException("checkOut must be > checkIn");

    const lastNight = addDaysUTC(end, -1);
    const days = eachDayUTC(start, lastNight);
    const rates = await this.prisma.roomRate.findMany({
      where: { roomTypeId, date: { gte: start, lte: lastNight } },
    });
    const map = new Map(rates.map((r) => [formatDate(r.date), Number(r.price)]));
    const result = days.map((d) => {
      const key = formatDate(d);
      const price = map.get(key);
      return { date: key, price: price ?? -1 };
    });
    if (result.some((r) => r.price < 0)) {
      throw new BadRequestException("Rates not set for one or more nights");
    }
    return result;
  }
}
