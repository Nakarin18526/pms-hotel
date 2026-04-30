import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
} from "@nestjs/common";
import { IsNumber, IsString, Min } from "class-validator";
import { PromptPayService } from "./promptpay.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

class AttachSlipDto {
  @IsString() slipUrl!: string;
}

class VerifySlipDto {
  @IsNumber() @Min(0) verifiedAmount!: number;
}

@Controller("payment/promptpay")
export class PromptPayController {
  constructor(private readonly svc: PromptPayService) {}

  /** Public: get payment instructions for a booking (QR or bank account) */
  @Get(":bookingId/qr")
  qr(@Param("bookingId") id: string) {
    return this.svc.getPaymentInstructions(id);
  }

  @Get(":bookingId/instructions")
  instructions(@Param("bookingId") id: string) {
    return this.svc.getPaymentInstructions(id);
  }

  /** Public: guest attaches uploaded slip URL to booking */
  @Post(":bookingId/slip")
  attach(@Param("bookingId") id: string, @Body() dto: AttachSlipDto) {
    return this.svc.attachSlip(id, dto.slipUrl);
  }

  /** Admin: confirm slip — also enforces amount matches */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post(":bookingId/verify")
  verify(
    @Param("bookingId") id: string,
    @Body() dto: VerifySlipDto,
    @Req() req: any,
  ) {
    return this.svc.verifySlip({
      bookingId: id,
      verifiedAmount: dto.verifiedAmount,
      adminId: req.user.sub,
    });
  }

  /** Admin: reject slip — clears it so guest can re-upload */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post(":bookingId/reject")
  reject(@Param("bookingId") id: string) {
    return this.svc.rejectSlip(id);
  }
}
