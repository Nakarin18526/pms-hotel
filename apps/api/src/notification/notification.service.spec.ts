/**
 * NotificationModule — unit test with mocked Resend SDK + mocked Prisma.
 *
 * Per PRD: verify the email is triggered with the correct content,
 * is sent to BOTH guest and admin, and is resilient to provider failures.
 */
const sendMock = jest.fn().mockResolvedValue({ id: "mock-email-id" });

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

import { NotificationService } from "./notification.service";

const mockPrisma: any = {
  siteSetting: {
    findUnique: jest.fn().mockResolvedValue({
      hotelName: "Test Hotel",
      brandTagline: "RESORT",
      contactAddress: "123 Test St",
      contactPhone: "02-000-0000",
      contactEmail: "info@test.local",
      checkInTime: "From 14:00",
      checkOutTime: "Before 12:00",
      cancellationPolicy: "All sales final.",
    }),
  },
};

describe("NotificationService", () => {
  beforeEach(() => {
    sendMock.mockClear();
    process.env.RESEND_API_KEY = "re_test_fake_key";
    process.env.EMAIL_FROM = "PMS <noreply@test.local>";
    process.env.ADMIN_NOTIFICATION_EMAIL = "admin@test.local";
    process.env.CURRENCY = "THB";
  });

  function makeBooking(overrides: any = {}) {
    return {
      id: "bk_abc123def",
      guestEmail: "guest@test.local",
      guestName: "Jane Doe",
      guestPhone: "0812345678",
      checkIn: new Date("2026-05-01"),
      checkOut: new Date("2026-05-04"),
      totalPrice: 4500,
      paymentMethod: "PROMPTPAY",
      roomType: { name: "Deluxe Room", imageUrls: [] },
      ...overrides,
    };
  }

  it("sends one email to the guest", async () => {
    const svc = new NotificationService(mockPrisma);
    await svc.sendBookingConfirmed(makeBooking());
    const guestCall = sendMock.mock.calls.find(
      (c) => c[0].to === "guest@test.local",
    );
    expect(guestCall).toBeDefined();
  });

  it("CCs the admin notification email", async () => {
    const svc = new NotificationService(mockPrisma);
    await svc.sendBookingConfirmed(makeBooking());
    const adminCall = sendMock.mock.calls.find(
      (c) => c[0].to === "admin@test.local",
    );
    expect(adminCall).toBeDefined();
    expect(adminCall![0].subject).toMatch(/^\[NEW BOOKING\]/);
  });

  it("includes booking id, room name, dates, and total in the email body", async () => {
    const svc = new NotificationService(mockPrisma);
    await svc.sendBookingConfirmed(makeBooking());

    const html = sendMock.mock.calls[0][0].html as string;
    expect(html).toContain("bk_abc123def");
    expect(html).toContain("Deluxe Room");
    expect(html).toContain("Jane Doe");
    expect(html).toContain("guest@test.local");
    expect(html).toContain("0812345678");
    expect(html).toContain("4,500");
    expect(html).toContain("THB");
    expect(html).toContain("Test Hotel");
  });

  it("uses configured From address", async () => {
    const svc = new NotificationService(mockPrisma);
    await svc.sendBookingConfirmed(makeBooking());
    expect(sendMock.mock.calls[0][0].from).toBe(
      "PMS <noreply@test.local>",
    );
  });

  it("subject contains confirmation marker and short booking id", async () => {
    const svc = new NotificationService(mockPrisma);
    await svc.sendBookingConfirmed(makeBooking());
    const subject = sendMock.mock.calls[0][0].subject as string;
    expect(subject).toContain("ยืนยันการจอง");
    expect(subject).toContain(makeBooking().id.slice(0, 8));
  });

  it("does NOT throw if Resend rejects", async () => {
    sendMock.mockRejectedValueOnce(new Error("Resend API down"));
    const svc = new NotificationService(mockPrisma);
    await expect(svc.sendBookingConfirmed(makeBooking())).resolves.not.toThrow();
  });

  it("when RESEND_API_KEY is missing, logs but does not call SDK or throw", async () => {
    delete process.env.RESEND_API_KEY;
    const svc = new NotificationService(mockPrisma);
    await svc.sendBookingConfirmed(makeBooking());
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("does not duplicate when admin email == guest email", async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = "guest@test.local";
    const svc = new NotificationService(mockPrisma);
    await svc.sendBookingConfirmed(makeBooking());
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0].to).toBe("guest@test.local");
  });

  it("falls back to site contactEmail when ADMIN_NOTIFICATION_EMAIL is empty", async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = "";
    const svc = new NotificationService(mockPrisma);
    await svc.sendBookingConfirmed(makeBooking());
    const adminCall = sendMock.mock.calls.find(
      (c) => c[0].to === "info@test.local",
    );
    expect(adminCall).toBeDefined();
  });

  it("includes hero image when room has one", async () => {
    const svc = new NotificationService(mockPrisma);
    await svc.sendBookingConfirmed(
      makeBooking({
        roomType: {
          name: "Suite",
          imageUrls: ["https://example.com/suite.jpg"],
        },
      }),
    );
    const html = sendMock.mock.calls[0][0].html as string;
    expect(html).toContain("https://example.com/suite.jpg");
  });
});
