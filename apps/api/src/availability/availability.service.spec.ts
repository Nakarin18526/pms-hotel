import { AvailabilityService } from "./availability.service";

/**
 * Pure unit tests on the overlap rule. Database calls are stubbed via a
 * minimal Prisma mock — these focus on the business invariant, not Prisma.
 */
describe("AvailabilityService — overlap semantics", () => {
  function svcWith(roomType: any, count: number) {
    const prisma = {
      roomType: { findUnique: jest.fn().mockResolvedValue(roomType) },
      booking: { count: jest.fn().mockResolvedValue(count) },
    } as any;
    const rates = { getRatesForBookingRange: jest.fn() } as any;
    return new AvailabilityService(prisma, rates);
  }

  it("returns totalUnits when no overlapping bookings", async () => {
    const svc = svcWith({ id: "rt", totalUnits: 5 }, 0);
    const r = await svc.availableUnits(
      "rt",
      new Date("2026-05-01"),
      new Date("2026-05-03"),
    );
    expect(r).toEqual({ totalUnits: 5, availableUnits: 5 });
  });

  it("subtracts a single confirmed overlapping booking", async () => {
    const svc = svcWith({ id: "rt", totalUnits: 5 }, 1);
    const r = await svc.availableUnits(
      "rt",
      new Date("2026-05-01"),
      new Date("2026-05-03"),
    );
    expect(r.availableUnits).toBe(4); // totalUnits - 1
  });

  it("subtracts multiple confirmed overlapping bookings", async () => {
    const svc = svcWith({ id: "rt", totalUnits: 5 }, 2);
    const r = await svc.availableUnits(
      "rt",
      new Date("2026-05-01"),
      new Date("2026-05-03"),
    );
    expect(r.availableUnits).toBe(3);
  });

  it("does not go negative when over-booked", async () => {
    const svc = svcWith({ id: "rt", totalUnits: 2 }, 5);
    const r = await svc.availableUnits(
      "rt",
      new Date("2026-05-01"),
      new Date("2026-05-03"),
    );
    expect(r.availableUnits).toBe(0);
  });

  it("excludes a given bookingId when checking (used for self-edit)", async () => {
    const prisma = {
      roomType: { findUnique: jest.fn().mockResolvedValue({ totalUnits: 5 }) },
      booking: { count: jest.fn().mockResolvedValue(0) },
    } as any;
    const svc = new AvailabilityService(prisma, {} as any);
    await svc.availableUnits(
      "rt",
      new Date("2026-05-01"),
      new Date("2026-05-03"),
      "self-id",
    );
    const arg = (prisma.booking.count as jest.Mock).mock.calls[0][0];
    expect(arg.where.NOT).toEqual({ id: "self-id" });
  });

  it("uses correct overlap predicate (lt checkOut, gt checkIn)", async () => {
    const prisma = {
      roomType: { findUnique: jest.fn().mockResolvedValue({ totalUnits: 5 }) },
      booking: { count: jest.fn().mockResolvedValue(0) },
    } as any;
    const svc = new AvailabilityService(prisma, {} as any);
    const ci = new Date("2026-05-01");
    const co = new Date("2026-05-03");
    await svc.availableUnits("rt", ci, co);
    const arg = (prisma.booking.count as jest.Mock).mock.calls[0][0];
    expect(arg.where.checkIn).toEqual({ lt: co });
    expect(arg.where.checkOut).toEqual({ gt: ci });
    expect(arg.where.status).toBe("CONFIRMED");
  });
});
