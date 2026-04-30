import { Module } from "@nestjs/common";
import { SiteSettingsService } from "./site-settings.service";
import { SiteSettingsController } from "./site-settings.controller";

@Module({
  providers: [SiteSettingsService],
  controllers: [SiteSettingsController],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
