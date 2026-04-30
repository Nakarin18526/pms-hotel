/**
 * BookingModule — integration tests against real Postgres.
 *
 * Verifies the full booking lifecycle:
 *   PENDING/UNPAID  →  (Stripe webhook)  →  CONFIRMED/PAID
 *   CONFIRMED       →  (admin cancel)    →  CANCELLED
 *   CONFIRMED       →  (admin update)    →  re-checks availability + recalculates total
 *   adminCreate (walk-in) → CONFIRMED + correct total
 *
 * Stripe + email are mocked; everything else hits the real DB.
 */
import { PrismaService } from "../src/prisma/prisma.service";
import { AvailabilityService } from "../src/availability/availability.service";
import { RateCalendarService } from "../src/rate-calendar/rate-calendar.service";
import { BookingService } from "../src/bookings/booking.service";
import { getPrisma, truncateAll } from "./db";

describe("BookingModule (integration)", () => {
  const prisma = getPrisma() as unknown as PrismaService;
  const rates = new RateCalendarService(prisma);
  const availability = new AvailabilityService(prisma, rates);

  const fakePayment: any = {
    createCheckoutSession: jest.fn().mockResolvedValue({
      id: "cs_test_fake_123",
      url: "https://stripe.test/session/123",
    }),
  };
  const fakeNotification: any = {
    sendBookingConfirmed: jest.fn().mockResolvedValue(undefined),
  };

  const svc = new BookingService(
    prisma,
    availability,
    rates,
    fakePayment,
    fakeNotification,
  );

  beforeEach(async () => {
    await truncateAll(prisma as any);
    fakePayment.createCheckoutSession.mockClear();
    fakeNotification.sendBookingConfirmed.mockClear();
  });

  afterAll(async () => {
    await (prisma as any).$disconnect();
  });

  async function setupRoom(units = 2) {
    const rt = await prisma.roomType.create({
      data: { name: "Std", maxOccupancy: 2, totalUnits: units, description: "" },
    });
    await rates.setRange(rt.id, "2026-05-01", "2026-05-31", 1500);
    return rt;
  }

  const guest = {
    guestName: "Jane",
    guestEmail: "jane@x.test",
    guestPhone: "0812345678",
  };

  describe("createGuestBooking", () => {
    it("creates a PENDING/UNPAID booking + Stripe session", async () => {
      const rt = await setupRoom();
      const result = await svc.createGuestBooking({
        roomTypeId: rt.id,
        checkIn: "2026-05-01",
        checkOut: "2026-05-04",
        ...guest,
      });
      expect(result.bookingId).toBeDefined();
      expect(result.checkoutUrl).toContain("stripe.test");

      const b = await prisma.booking.findUnique({
        where: { id: result.bookingId },
      });
      expect(b?.status).toBe("PENDING");
      expect(b?.paymentStatus).toBe("UNPAID");
      expect(b?.stripeSessionId).toBe("cs_test_fake_123");
      expect(Number(b?.totalPrice)).toBe(4500); // 3 nights × 1500
    });

    it("rejects when no availability", async () => {
      const rt = await setupRoom(1);
      // Pre-fill the only unit with a CONFIRMED booking
      await prisma.booking.create({
        data: {
          roomTypeId: rt.id,
          checkIn: new Date("2026-05-01"),
          checkOut: new Date("2026-05-04"),
          totalPrice: 4500,
          ...guest,
          status: "CONFIRMED",
          paymentStatus: "PAID",
        },
      });
      await expect(
        svc.createGuestBooking({
          roomTypeId: rt.id,
          checkIn: "2026-05-01",
          checkOut: "2026-05-04",
          ...guest,
        }),
      ).rejects.toThrow(/availability/i);
    });

    it("rejects when checkOut <= checkIn", async () => {
      const rt = await setupRoom();
      await expect(
        svc.createGuestBooking({
          roomTypeId: rt.id,
          checkIn: "2026-05-04",
          checkOut: "2026-05-04",
          ...guest,
        }),
      ).rejects.toThrow();
    });

    it("rejects when nights are missing rates", async () => {
      const rt = await prisma.roomType.create({
        data: { name: "NoRate", maxOccupancy: 2, totalUnits: 1, description: "" },
      });
      await expect(
        svc.createGuestBooking({
          roomTypeId: rt.id,
          checkIn: "2026-05-01",
          checkOut: "2026-05-03",
          ...guest,
        }),
      ).rejects.toThrow(/Rates not set/);
    });

    it("PROMPTPAY method skips Stripe session and returns local URL", async () => {
      const rt = await setupRoom();
      const result = await svc.createGuestBooking({
        roomTypeId: rt.id,
        checkIn: "2026-05-01",
        checkOut: "2026-05-04",
        paymentMethod: "PROMPTPAY",
        ...guest,
      });
      expect(fakePayment.createCheckoutSession).not.toHaveBeenCalled();
      expect(result.checkoutUrl).toMatch(/promptpay$/);
      expect(result.sessionId).toBeNull();

      const b = await prisma.booking.findUnique({
        where: { id: result.bookingId },
      });
      expect(b?.paymentMethod).toBe("PROMPTPAY");
    });
  });

  describe("confirmFromStripeSession", () => {
    it("transitions PENDING/UNPAID → CONFIRMED/PAID and sends email", async () => {
      const rt = await setupRoom();
      const created = await svc.createGuestBooking({
        roomTypeId: rt.id,
        checkIn: "2026-05-01",
        checkOut: "2026-05-04",
        ...guest,
      });

      const updated = await svc.confirmFromStripeSession("cs_test_fake_123");
      expect(updated?.status).toBe("CONFIRMED");
      expect(updated?.paymentStatus).toBe("PAID");
      expect(fakeNotification.sendBookingConfirmed).toHaveBeenCalledTimes(1);

      const b = await prisma.booking.findUnique({
        where: { id: created.bookingId },
      });
      expect(b?.status).toBe("CONFIRMED");
    });

    it("is IDEMPOTENT — second call does not re-send email", async () => {
      const rt = await setupRoom();
      await svc.createGuestBooking({
        roomTypeId: rt.id,
        checkIn: "2026-05-01",
        checkOut: "2026-05-04",
        ...guest,
      });
      await svc.confirmFromStripeSession("cs_test_fake_123");
      await svc.confirmFromStripeSession("cs_test_fake_123");
      await svc.confirmFromStripeSession("cs_test_fake_123");
      expect(fakeNotification.sendBookingConfirmed).toHaveBeenCalledTimes(1);
    });

    it("returns null for unknown session id", async () => {
      const result = await svc.confirmFromStripeSession("cs_unknown");
      expect(result).toBeNull();
    });
  });

  describe("cancel", () => {
    it("changes status to CANCELLED", async () => {
      const rt = await setupRoom();
      const c = await svc.createGuestBooking({
        roomTypeId: rt.id,
        checkIn: "2026-05-01",
        checkOut: "2026-05-04",
        ...guest,
      });
      const cancelled = await svc.cancel(c.bookingId);
      expect(cancelled.status).toBe("CANCELLED");
    });

    it("frees up inventory (cancelled rooms become available again)", async () => {
      const rt = await setupRoom(1);
      const c = await svc.createGuestBooking({
        roomTypeId: rt.id,
        checkIn: "2026-05-01",
        checkOut: "2026-05-04",
        ...guest,
      });
      await svc.confirmFromStripeSession("cs_test_fake_123"); // make CONFIRMED
      let avail = await availability.availableUnits(
        rt.id,
        new Date("2026-05-01"),
        new Date("2026-05-04"),
      );
      expect(avail.availableUnits).toBe(0);

      await svc.cancel(c.bookingId);
      avail = await availability.availableUnits(
        rt.id,
        new Date("2026-05-01"),
        new Date("2026-05-04"),
      );
      expect(avail.availableUnits).toBe(1);
    });
  });

  describe("update (admin edit)", () => {
    it("recalculates totalPrice when dates change", async () => {
      const rt = await setupRoom();
      const c = await svc.createGuestBooking({
        roomTypeId: rt.id,
        checkIn: "2026-05-01",
        checkOut: "2026-05-04", // 3 nights × 1500 = 4500
        ...guest,
      });
      const updated = await svc.update(c.bookingId, {
        checkOut: "2026-05-06", // now 5 nights × 1500 = 7500
      });
      expect(Number(updated.totalPrice)).toBe(7500);
    });

    it("rejects update when new dates have no availability", async () => {
      const rtA = await setupRoom(1);
      // Create another booking that occupies the new range
      await prisma.booking.create({
        data: {
          roomTypeId: rtA.id,
          checkIn: new Date("2026-05-10"),
          checkOut: new Date("2026-05-15"),
          totalPrice: 7500,
          ...guest,
          status: "CONFIRMED",
          paymentStatus: "PAID",
        },
      });
      const c = await svc.createGuestBooking({
        roomTypeId: rtA.id,
        checkIn: "2026-05-01",
        checkOut: "2026-05-04",
        ...guest,
      });
      await svc.confirmFromStripeSession("cs_test_fake_123");

      await expect(
        svc.update(c.bookingId, {
          checkIn: "2026-05-10",
          checkOut: "2026-05-15",
        }),
      ).rejects.toThrow(/availability/i);
    });
  });

  describe("adminCreate (walk-in)", () => {
    it("creates a CONFIRMED booking with correct total", async () => {
      const rt = await setupRoom();
      const b = await svc.adminCreate({
        roomTypeId: rt.id,
        checkIn: "2026-05-01",
        checkOut: "2026-05-04",
        ...guest,
      });
      expect(b.status).toBe("CONFIRMED");
      expect(Number(b.totalPrice)).toBe(4500);
    });
  });

  describe("markPaid", () => {
    it("transitions to PAID + CONFIRMED", async () => {
      const rt = await setupRoom();
      const c = await svc.createGuestBooking({
        roomTypeId: rt.id,
        checkIn: "2026-05-01",
        checkOut: "2026-05-04",
        ...guest,
      });
      const updated = await svc.markPaid(c.bookingId);
      expect(updated.paymentStatus).toBe("PAID");
      expect(updated.status).toBe("CONFIRMED");
    });
  });

  describe("adminList filters", () => {
    it("filters by status", async () => {
      const rt = await setupRoom(3);
      // Create 2 confirmed + 1 pending bookings
      await prisma.booking.createMany({
        data: [
          {
            roomTypeId: rt.id,
            checkIn: new Date("2026-05-01"),
            checkOut: new Date("2026-05-02"),
            totalPrice: 1500,
            ...guest,
            status: "CONFIRMED",
            paymentStatus: "PAID",
          },
          {
            roomTypeId: rt.id,
            checkIn: new Date("2026-05-02"),
            checkOut: new Date("2026-05-03"),
            totalPrice: 1500,
            ...guest,
            status: "CONFIRMED",
            paymentStatus: "PAID",
          },
          {
            roomTypeId: rt.id,
            checkIn: new Date("2026-05-03"),
            checkOut: new Date("2026-05-04"),
            totalPrice: 1500,
            ...guest,
            status: "PENDING",
            paymentStatus: "UNPAID",
          },
        ],
      });
      const confirmed = await svc.adminList({ status: "CONFIRMED" });
      expect(confirmed).toHaveLength(2);
      const pending = await svc.adminList({ status: "PENDING" });
      expect(pending).toHaveLength(1);
    });
  });
});
