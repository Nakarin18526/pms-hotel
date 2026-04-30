import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface UpdatePaymentSettingArgs {
  transferType: "PROMPTPAY" | "BANK_ACCOUNT";
  promptpayId?: string | null;
  promptpayName?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  bankPromptpayId?: string | null;
  notes?: string | null;
}

@Injectable()
export class PaymentSettingsService {
  constructor(private prisma: PrismaService) {}

  /** Lazily creates the singleton row with defaults pulled from env (legacy). */
  async get() {
    let setting = await this.prisma.paymentSetting.findUnique({
      where: { id: "default" },
    });
    if (!setting) {
      setting = await this.prisma.paymentSetting.create({
        data: {
          id: "default",
          transferType: "PROMPTPAY",
          promptpayId: process.env.PROMPTPAY_ID || null,
          promptpayName: process.env.PROMPTPAY_RECEIVER_NAME || null,
        },
      });
    }
    return setting;
  }

  async update(args: UpdatePaymentSettingArgs) {
    if (args.transferType === "PROMPTPAY") {
      const id = (args.promptpayId ?? "").replace(/[\s-]/g, "");
      if (!/^(0\d{9}|\d{13})$/.test(id)) {
        throw new BadRequestException(
          "PromptPay ID ต้องเป็นเบอร์โทร 10 หลัก (เช่น 0812345678) หรือเลขบัตรประชาชน 13 หลัก",
        );
      }
      args.promptpayId = id;
      if (!args.promptpayName?.trim()) {
        throw new BadRequestException("กรุณากรอกชื่อผู้รับ");
      }
    } else {
      if (!args.bankName?.trim() || !args.bankAccountNumber?.trim() || !args.bankAccountName?.trim()) {
        throw new BadRequestException(
          "กรุณากรอกข้อมูลธนาคารให้ครบ (ธนาคาร, เลขบัญชี, ชื่อบัญชี)",
        );
      }
      // Optional bankPromptpayId — validate format if provided
      if (args.bankPromptpayId) {
        const id = args.bankPromptpayId.replace(/[\s-]/g, "");
        if (!/^(0\d{9}|\d{13})$/.test(id)) {
          throw new BadRequestException(
            "PromptPay ID ต้องเป็นเบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลัก",
          );
        }
        args.bankPromptpayId = id;
      }
    }

    await this.get(); // ensure exists
    return this.prisma.paymentSetting.update({
      where: { id: "default" },
      data: {
        transferType: args.transferType,
        promptpayId: args.promptpayId ?? null,
        promptpayName: args.promptpayName ?? null,
        bankName: args.bankName ?? null,
        bankAccountNumber: args.bankAccountNumber ?? null,
        bankAccountName: args.bankAccountName ?? null,
        bankPromptpayId: args.bankPromptpayId ?? null,
        notes: args.notes ?? null,
      },
    });
  }
}
