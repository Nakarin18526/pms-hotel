/**
 * AvailabilityModule — integration tests against a real Postgres DB.
 *
 * Verifies the overlap predicate ALL THE WAY THROUGH Prisma:
 *   availableUnits = totalUnits - count(CONFIRMED bookings overlapping range)
 *
 * Each test creates its own room type and bookings, then truncates after.
 */
import { PrismaService } from "../src/prisma/prisma.service";
import { AvailabilityService } from "../src/availability/availability.service";
import { RateCalendarService } from "../src/rate-calendar/rate-calendar.service";
import { getPrisma, truncateAll, utcDate } from "./db";

describe("AvailabilityModule (integration)", () => {
  const prisma = getPrisma() as unknown as PrismaService;
  const rates = new RateCalendarService(prisma);
  const svc = new AvailabilityService(prisma, rates);

  beforeEach(async () => {
    await truncateAll(prisma as any);
  });

  afterAll(async () => {
    await (prisma as any).$disconnect();
  });

  async function createRoom(totalUnits: number, name = "Test Room") {
    return prisma.roomType.create({
      data: { name, description: "", maxOccupancy: 2, totalUnits },
    });
  }

  async function createBooking(args: {
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    status?: "PENDING" | "CONFIRMED" | "CANCELLED";
  }) {
    return prisma.booking.create({
      data: {
        roomTypeId: args.roomTypeId,
        checkIn: utcDate(args.checkIn),
        checkOut: utcDate(args.checkOut),
        totalPrice: 1000,
        guestName: "G",
        guestPhone: "0",
        guestEmail: "g@x.test",
        status: args.status ?? "CONFIRMED",
        paymentStatus: "PAID",
      },
    });
  }

  it("returns totalUnits when no bookings exist", async () => {
    const rt = await createRoom(5);
    const r = await svc.availableUnits(
      rt.id,
      utcDate("2026-05-01"),
      utcDate("2026-05-03"),
    );
    expect(r).toEqual({ totalUnits: 5, availableUnits: 5 });
  });

  it("subtracts 1 when a single CONFIRMED booking overlaps", async () => {
    const rt = await createRoom(5);
    await createBooking({
      roomTypeId: rt.id,
      checkIn: "2026-05-01",
      checkOut: "2026-05-03",
    });
    const r = await svc.availableUnits(
      rt.id,
      utcDate("2026-05-01"),
      utcDate("2026-05-03"),
    );
    expect(r.availableUnits).toBe(4);
  });

  it("returns 0 when fully booked", async () => {
    const rt = await createRoom(2);
    await createBooking({
      roomTypeId: rt.id,
      checkIn: "2026-05-01",
      checkOut: "2026-05-03",
    });
    await createBooking({
      roomTypeId: rt.id,
      checkIn: "2026-05-01",
      checkOut: "2026-05-03",
    });
    const r = await svc.availableUnits(
      rt.id,
      utcDate("2026-05-01"),
      utcDate("2026-05-03"),
    );
    expect(r.availableUnits).toBe(0);
  });

  it("counts a booking that partially overlaps the start", async () => {
    const rt = await createRoom(3);
    await createBooking({
      roomTypeId: rt.id,
      checkIn: "2026-04-29", // before
      checkOut: "2026-05-02", // overlaps
    });
    const r = await svc.availableUnits(
      rt.id,
      utcDate("2026-05-01"),
      utcDate("2026-05-05"),
    );
    expect(r.availableUnits).toBe(2);
  });

  it("counts a booking that partially overlaps the end", async () => {
    const rt = await createRoom(3);
    await createBooking({
      roomTypeId: rt.id,
      checkIn: "2026-05-04",
      checkOut: "2026-05-08", // extends past requested end
    });
    const r = await svc.availableUnits(
      rt.id,
      utcDate("2026-05-01"),
      utcDate("2026-05-05"),
    );
    expect(r.availableUnits).toBe(2);
  });

  it("does NOT count back-to-back bookings (one's checkOut == other's checkIn)", async () => {
    const rt = await createRoom(2);
    // Existing booking ends exactly when our search begins
    await createBooking({
      roomTypeId: rt.id,
      checkIn: "2026-04-28",
      checkOut: "2026-05-01", // ends on our checkIn — must NOT count
    });
    // Another existing booking starts when our search ends
    await createBooking({
      roomTypeId: rt.id,
      checkIn: "2026-05-05",
      checkOut: "2026-05-08",
    });
    const r = await svc.availableUnits(
      rt.id,
      utcDate("2026-05-01"),
      utcDate("2026-05-05"),
    );
    expect(r.availableUnits).toBe(2); // both back-to-back → no overlap
  });

  it("does NOT count CANCELLED bookings", async () => {
    const rt = await createRoom(3);
    await createBooking({
      roomTypeId: rt.id,
      checkIn: "2026-05-01",
      checkOut: "2026-05-05",
      status: "CANCELLED",
    });
    const r = await svc.availableUnits(
      rt.id,
      utcDate("2026-05-01"),
      utcDate("2026-05-05"),
    );
    expect(r.availableUnits).toBe(3); // cancelled doesn't reduce inventory
  });

  it("does NOT count PENDING bookings (only CONFIRMED reduce inventory)", async () => {
    const rt = await createRoom(3);
    await createBooking({
      roomTypeId: rt.id,
      checkIn: "2026-05-01",
      checkOut: "2026-05-05",
      status: "PENDING",
    });
    const r = await svc.availableUnits(
      rt.id,
      utcDate("2026-05-01"),
      utcDate("2026-05-05"),
    );
    expect(r.availableUnits).toBe(3);
  });

  it("excludes a booking by id when re-checking (used for self-edit)", async () => {
    const rt = await createRoom(1);
    const b = await createBooking({
      roomTypeId: rt.id,
      checkIn: "2026-05-01",
      checkOut: "2026-05-05",
    });
    // Without exclude, would be 0; with exclude = the booking itself, full inventory
    const r = await svc.availableUnits(
      rt.id,
      utcDate("2026-05-01"),
      utcDate("2026-05-05"),
      b.id,
    );
    expect(r.availableUnits).toBe(1);
  });
});
