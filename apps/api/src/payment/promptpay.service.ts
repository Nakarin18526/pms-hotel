import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import * as QRCode from "qrcode";
// @ts-ignore — promptpay-qr ships without types
import generatePayload from "promptpay-qr";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationService } from "../notification/notification.service";
import { PaymentSettingsService } from "./payment-settings.service";

@Injectable()
export class PromptPayService {
  private readonly logger = new Logger(PromptPayService.name);

  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
    private settings: PaymentSettingsService,
  ) {}

  /**
   * Returns the payment instructions for a booking — either a generated
   * PromptPay QR (with the exact amount embedded) or bank-account info.
   * The shape is determined by the admin's PaymentSetting.
   */
  async getPaymentInstructions(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new BadRequestException("Booking not found");
    const amount = Number(booking.totalPrice);
    const setting = await this.settings.get();

    if (setting.transferType === "PROMPTPAY") {
      if (!setting.promptpayId) {
        throw new BadRequestException(
          "ผู้ดูแลระบบยังไม่ได้ตั้งค่า PromptPay — ไปที่ Admin → Payment Settings",
        );
      }
      const payload = generatePayload(setting.promptpayId, { amount });
      const qrDataUrl = await QRCode.toDataURL(payload, {
        margin: 1,
        width: 360,
        errorCorrectionLevel: "M",
      });
      return {
        type: "PROMPTPAY" as const,
        bookingId,
        amount,
        currency: process.env.CURRENCY ?? "THB",
        promptpay: {
          id: setting.promptpayId,
          name: setting.promptpayName ?? "Hotel",
          qrDataUrl,
          payload,
        },
        notes: setting.notes ?? null,
      };
    }

    if (
      !setting.bankName ||
      !setting.bankAccountNumber ||
      !setting.bankAccountName
    ) {
      throw new BadRequestException(
        "ผู้ดูแลระบบยังไม่ได้ตั้งค่าเลขบัญชีธนาคาร — ไปที่ Admin → Payment Settings",
      );
    }

    // Optional: also generate a PromptPay QR alongside the bank info if admin enabled it
    let promptpay: { id: string; name: string; qrDataUrl: string; payload: string } | undefined;
    if (setting.bankPromptpayId) {
      const payload = generatePayload(setting.bankPromptpayId, { amount });
      const qrDataUrl = await QRCode.toDataURL(payload, {
        margin: 1,
        width: 360,
        errorCorrectionLevel: "M",
      });
      promptpay = {
        id: setting.bankPromptpayId,
        name: setting.bankAccountName,
        qrDataUrl,
        payload,
      };
    }

    return {
      type: "BANK_ACCOUNT" as const,
      bookingId,
      amount,
      currency: process.env.CURRENCY ?? "THB",
      bank: {
        name: setting.bankName,
        accountNumber: setting.bankAccountNumber,
        accountName: setting.bankAccountName,
      },
      promptpay,
      notes: setting.notes ?? null,
    };
  }

  /**
   * Guest uploads a slip image. Mark the booking AWAITING_VERIFICATION
   * until an admin confirms the amount on the slip matches the booking total.
   */
  async attachSlip(bookingId: string, slipUrl: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new BadRequestException("Booking not found");
    if (booking.paymentStatus === "PAID") return booking;

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentMethod: "PROMPTPAY", // re-used for any "transfer + slip" flow
        paymentStatus: "AWAITING_VERIFICATION",
        slipUrl,
        slipUploadedAt: new Date(),
      },
      include: { roomType: true },
    });
  }

  async verifySlip(args: {
    bookingId: string;
    verifiedAmount: number;
    adminId: string;
  }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: args.bookingId },
      include: { roomType: true },
    });
    if (!booking) throw new BadRequestException("Booking not found");
    if (!booking.slipUrl)
      throw new BadRequestException("No slip uploaded for this booking");

    const expected = Number(booking.totalPrice);
    if (Math.abs(expected - args.verifiedAmount) > 0.01) {
      throw new BadRequestException(
        `จำนวนเงินไม่ตรง: คาดว่า ${expected} บาท แต่สลิประบุ ${args.verifiedAmount} บาท`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: args.bookingId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        slipVerifiedAt: new Date(),
        slipVerifiedBy: args.adminId,
      },
      include: { roomType: true },
    });
    await this.notification.sendBookingConfirmed(updated);
    return updated;
  }

  async rejectSlip(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new BadRequestException("Booking not found");
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: "UNPAID",
        slipUrl: null,
        slipUploadedAt: null,
      },
      include: { roomType: true },
    });
  }
}
