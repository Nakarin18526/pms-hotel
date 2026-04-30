import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from "@nestjs/common";
import { SiteSettingsService } from "./site-settings.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { SuperAdminGuard } from "../auth/super-admin.guard";

@Controller()
export class SiteSettingsController {
  constructor(private readonly svc: SiteSettingsService) {}

  /** Public read */
  @Get("site-settings")
  publicGet() {
    return this.svc.get();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Get("admin/site-settings")
  adminGet() {
    return this.svc.get();
  }

  @UseGuards(JwtAuthGuard, RolesGuard, SuperAdminGuard)
  @Roles("ADMIN")
  @Put("admin/site-settings")
  update(@Body() body: any) {
    return this.svc.update(body);
  }
}
