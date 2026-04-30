import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { AdminsService } from "./admins.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { SuperAdminGuard } from "../auth/super-admin.guard";
import { AdminRole } from "@prisma/client";

class CreateAdminDto {
  @IsEmail() email!: string;
  @IsString() name!: string;
  @IsString() @MinLength(8) password!: string;
  @IsEnum(["SUPER_ADMIN", "STAFF"]) role!: AdminRole;
}

class UpdateAdminDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(["SUPER_ADMIN", "STAFF"]) role?: AdminRole;
  @IsOptional() @IsString() @MinLength(8) password?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard, SuperAdminGuard)
@Roles("ADMIN")
@Controller("admin/admins")
export class AdminsController {
  constructor(private readonly svc: AdminsService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Post()
  create(@Body() dto: CreateAdminDto) {
    return this.svc.create(dto);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateAdminDto,
    @Req() req: any,
  ) {
    return this.svc.update(req.user.sub, id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    return this.svc.remove(req.user.sub, id);
  }
}
