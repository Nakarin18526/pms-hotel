import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { RoomTypeService } from "./room-type.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { SuperAdminGuard } from "../auth/super-admin.guard";

class CreateRoomTypeDto {
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(1) maxOccupancy!: number;
  @IsInt() @Min(1) totalUnits!: number;
  @IsOptional() @IsArray() imageUrls?: string[];
}

class UpdateRoomTypeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1) maxOccupancy?: number;
  @IsOptional() @IsInt() @Min(1) totalUnits?: number;
  @IsOptional() @IsArray() imageUrls?: string[];
}

@Controller("room-types")
export class RoomTypeController {
  constructor(private readonly svc: RoomTypeService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.svc.get(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, SuperAdminGuard)
  @Roles("ADMIN")
  @Post()
  create(@Body() dto: CreateRoomTypeDto) {
    return this.svc.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, SuperAdminGuard)
  @Roles("ADMIN")
  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateRoomTypeDto) {
    return this.svc.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, SuperAdminGuard)
  @Roles("ADMIN")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.svc.remove(id);
  }
}
