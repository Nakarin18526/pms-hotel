import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SiteSettingsService {
  constructor(private prisma: PrismaService) {}

  /** Returns the singleton — creating it with schema defaults if missing. */
  async get() {
    let s = await this.prisma.siteSetting.findUnique({
      where: { id: "default" },
    });
    if (!s) {
      s = await this.prisma.siteSetting.create({ data: { id: "default" } });
    }
    return s;
  }

  async update(data: Partial<Record<string, string>>) {
    await this.get();
    // Only allow known string fields — Prisma will reject unknowns anyway
    return this.prisma.siteSetting.update({
      where: { id: "default" },
      data,
    });
  }
}
