/**
 * PaymentModule — integration test focused on the WEBHOOK contract.
 *
 * Verifies the most important production invariant:
 *   Stripe may retry webhooks. Our handler MUST be idempotent —
 *   the booking state must be the same after 1 call vs N calls,
 *   and the confirmation email must fire at most once.
 *
 * The Stripe SDK itself is mocked (we don't make real API calls),
 * but the entire booking-confirmation flow goes through the real
 * Postgres DB.
 */
import { PrismaService } from "../src/prisma/prisma.service";
import { AvailabilityService } from "../src/availability/availability.service";
import { RateCalendarService } from "../src/rate-calendar/rate-calendar.service";
import { BookingService } from "../src/bookings/booking.service";
import { getPrisma, truncateAll } from "./db";

describe("PaymentModule — Stripe webhook handling (integration)", () => {
  const prisma = getPrisma() as unknown as PrismaService;
  const rates = new RateCalendarService(prisma);
  const availability = new AvailabilityService(prisma, rates);

  const stripeMock: any = {
    createCheckoutSession: jest.fn().mockResolvedValue({
      id: "cs_test_webhook_idem",
      url: "https://stripe.test/x",
    }),
  };
  const notification: any = {
    sendBookingConfirmed: jest.fn().mockResolvedValue(undefined),
  };

  const bookings = new BookingService(
    prisma,
    availability,
    rates,
    stripeMock,
    notification,
  );

  beforeEach(async () => {
    await truncateAll(prisma as any);
    stripeMock.createCheckoutSession.mockClear();
    notification.sendBookingConfirmed.mockClear();
  });

  afterAll(async () => {
    await (prisma as any).$disconnect();
  });

  async function setup() {
    const rt = await prisma.roomType.create({
      data: { name: "Std", maxOccupancy: 2, totalUnits: 1, description: "" },
    });
    await rates.setRange(rt.id, "2026-05-01", "2026-05-10", 2000);
    return bookings.createGuestBooking({
      roomTypeId: rt.id,
      checkIn: "2026-05-01",
      checkOut: "2026-05-04",
      guestName: "Webhook Test",
      guestEmail: "wh@x.test",
      guestPhone: "0",
    });
  }

  it("first webhook call confirms the booking and sends one email", async () => {
    await setup();
    const after = await bookings.confirmFromStripeSession(
      "cs_test_webhook_idem",
    );
    expect(after?.status).toBe("CONFIRMED");
    expect(after?.paymentStatus).toBe("PAID");
    expect(notification.sendBookingConfirmed).toHaveBeenCalledTimes(1);
  });

  it("is idempotent — repeated webhooks do NOT re-confirm or re-send email", async () => {
    const created = await setup();

    // Simulate Stripe retrying 5 times in a row
    for (let i = 0; i < 5; i++) {
      await bookings.confirmFromStripeSession("cs_test_webhook_idem");
    }

    expect(notification.sendBookingConfirmed).toHaveBeenCalledTimes(1);

    const final = await prisma.booking.findUnique({
      where: { id: created.bookingId },
    });
    expect(final?.status).toBe("CONFIRMED");
    expect(final?.paymentStatus).toBe("PAID");
  });

  it("ignores webhook for unknown session id (returns null, no error)", async () => {
    const result = await bookings.confirmFromStripeSession("cs_unknown_xyz");
    expect(result).toBeNull();
    expect(notification.sendBookingConfirmed).not.toHaveBeenCalled();
  });

  it("does NOT change a booking that's already CONFIRMED+PAID via another path", async () => {
    const rt = await prisma.roomType.create({
      data: { name: "X", maxOccupancy: 2, totalUnits: 1, description: "" },
    });
    // Pre-existing booking confirmed by admin (mark-paid), not via Stripe
    const b = await prisma.booking.create({
      data: {
        roomTypeId: rt.id,
        checkIn: new Date("2026-06-01"),
        checkOut: new Date("2026-06-02"),
        totalPrice: 1500,
        guestName: "Manual",
        guestEmail: "m@x.test",
        guestPhone: "0",
        status: "CONFIRMED",
        paymentStatus: "PAID",
        stripeSessionId: "cs_already_paid",
      },
    });

    await bookings.confirmFromStripeSession("cs_already_paid");
    expect(notification.sendBookingConfirmed).not.toHaveBeenCalled();

    const after = await prisma.booking.findUnique({ where: { id: b.id } });
    expect(after?.status).toBe("CONFIRMED");
  });
});
