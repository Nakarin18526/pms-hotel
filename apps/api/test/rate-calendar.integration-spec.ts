/**
 * RateCalendarModule — integration tests against real Postgres.
 *
 * Verifies:
 *  - setRange upserts every night in [startDate, endDate] inclusive
 *  - getRange returns rates as date-string + price
 *  - getRatesForBookingRange returns N nights for N-day stay (checkOut exclusive)
 *  - getRatesForBookingRange THROWS if any night is missing a rate
 *  - Date handling is timezone-safe (no off-by-one near DST/UTC boundaries)
 */
import { PrismaService } from "../src/prisma/prisma.service";
import { RateCalendarService } from "../src/rate-calendar/rate-calendar.service";
import { getPrisma, truncateAll, utcDate } from "./db";

describe("RateCalendarModule (integration)", () => {
  const prisma = getPrisma() as unknown as PrismaService;
  const svc = new RateCalendarService(prisma);

  beforeEach(async () => {
    await truncateAll(prisma as any);
  });

  afterAll(async () => {
    await (prisma as any).$disconnect();
  });

  async function createRoom() {
    return prisma.roomType.create({
      data: { name: "Std", description: "", maxOccupancy: 2, totalUnits: 1 },
    });
  }

  it("setRange writes one rate per day (inclusive)", async () => {
    const rt = await createRoom();
    const result = await svc.setRange(rt.id, "2026-05-01", "2026-05-05", 2500);
    expect(result.updated).toBe(5);

    const rates = await svc.getRange(rt.id, "2026-05-01", "2026-05-05");
    expect(rates.map((r) => r.date)).toEqual([
      "2026-05-01",
      "2026-05-02",
      "2026-05-03",
      "2026-05-04",
      "2026-05-05",
    ]);
    expect(rates.every((r) => r.price === 2500)).toBe(true);
  });

  it("setRange updates existing rates idempotently (upsert)", async () => {
    const rt = await createRoom();
    await svc.setRange(rt.id, "2026-05-01", "2026-05-03", 2000);
    await svc.setRange(rt.id, "2026-05-01", "2026-05-03", 3500); // overwrite

    const rates = await svc.getRange(rt.id, "2026-05-01", "2026-05-03");
    expect(rates).toHaveLength(3);
    expect(rates.every((r) => r.price === 3500)).toBe(true);
  });

  it("setRange of single day works (start == end)", async () => {
    const rt = await createRoom();
    const result = await svc.setRange(rt.id, "2026-05-10", "2026-05-10", 1234);
    expect(result.updated).toBe(1);
  });

  it("setRange rejects when endDate < startDate", async () => {
    const rt = await createRoom();
    await expect(
      svc.setRange(rt.id, "2026-05-10", "2026-05-01", 1000),
    ).rejects.toThrow();
  });

  it("setRange rejects negative price", async () => {
    const rt = await createRoom();
    await expect(
      svc.setRange(rt.id, "2026-05-01", "2026-05-01", -1),
    ).rejects.toThrow();
  });

  it("getRatesForBookingRange returns N nights for N-day stay (checkOut exclusive)", async () => {
    const rt = await createRoom();
    await svc.setRange(rt.id, "2026-05-01", "2026-05-05", 1500);

    // 3-night stay: May 1 → May 4 covers nights of May 1, 2, 3
    const result = await svc.getRatesForBookingRange(
      rt.id,
      utcDate("2026-05-01"),
      utcDate("2026-05-04"),
    );
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.date)).toEqual([
      "2026-05-01",
      "2026-05-02",
      "2026-05-03",
    ]);
    expect(result.reduce((s, r) => s + r.price, 0)).toBe(4500);
  });

  it("getRatesForBookingRange throws if any night is missing a rate", async () => {
    const rt = await createRoom();
    // Only May 1-2 have rates; May 3 missing
    await svc.setRange(rt.id, "2026-05-01", "2026-05-02", 1500);
    await expect(
      svc.getRatesForBookingRange(
        rt.id,
        utcDate("2026-05-01"),
        utcDate("2026-05-04"),
      ),
    ).rejects.toThrow(/Rates not set/);
  });

  it("supports varying nightly prices", async () => {
    const rt = await createRoom();
    // Set May 1 = 1000, May 2 = 2000, May 3 = 3000
    await svc.setRange(rt.id, "2026-05-01", "2026-05-01", 1000);
    await svc.setRange(rt.id, "2026-05-02", "2026-05-02", 2000);
    await svc.setRange(rt.id, "2026-05-03", "2026-05-03", 3000);

    const result = await svc.getRatesForBookingRange(
      rt.id,
      utcDate("2026-05-01"),
      utcDate("2026-05-04"),
    );
    expect(result.map((r) => r.price)).toEqual([1000, 2000, 3000]);
  });

  it("dates round-trip without timezone drift", async () => {
    const rt = await createRoom();
    // Edge case: dates at month boundary often shift in non-UTC handling
    await svc.setRange(rt.id, "2026-04-30", "2026-05-01", 999);
    const rates = await svc.getRange(rt.id, "2026-04-30", "2026-05-01");
    expect(rates.map((r) => r.date)).toEqual(["2026-04-30", "2026-05-01"]);
  });
});
