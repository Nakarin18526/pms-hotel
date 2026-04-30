import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from "@nestjs/common";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaymentSettingsService } from "./payment-settings.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { SuperAdminGuard } from "../auth/super-admin.guard";

class UpdateSettingsDto {
  @IsEnum(["PROMPTPAY", "BANK_ACCOUNT"])
  transferType!: "PROMPTPAY" | "BANK_ACCOUNT";

  @IsOptional() @IsString() promptpayId?: string;
  @IsOptional() @IsString() promptpayName?: string;

  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() bankAccountNumber?: string;
  @IsOptional() @IsString() bankAccountName?: string;
  @IsOptional() @IsString() bankPromptpayId?: string;

  @IsOptional() @IsString() notes?: string;
}

@Controller()
export class PaymentSettingsController {
  constructor(private readonly svc: PaymentSettingsService) {}

  /** Public read — returns receiver info for the booking flow */
  @Get("payment/settings")
  publicGet() {
    return this.svc.get();
  }

  /** Admin read */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Get("admin/payment-settings")
  adminGet() {
    return this.svc.get();
  }

  /** Admin update */
  @UseGuards(JwtAuthGuard, RolesGuard, SuperAdminGuard)
  @Roles("ADMIN")
  @Put("admin/payment-settings")
  update(@Body() dto: UpdateSettingsDto) {
    return this.svc.update(dto);
  }
}
