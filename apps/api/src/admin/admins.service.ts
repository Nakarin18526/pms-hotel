import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { AdminRole } from "@prisma/client";

export interface CreateAdminArgs {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}

export interface UpdateAdminArgs {
  name?: string;
  role?: AdminRole;
  password?: string;
}

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.admin.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async create(args: CreateAdminArgs) {
    const email = args.email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new BadRequestException("Invalid email");
    if (args.password.length < 8)
      throw new BadRequestException("Password must be at least 8 characters");
    if (!args.name.trim())
      throw new BadRequestException("Name is required");
    const existing = await this.prisma.admin.findUnique({ where: { email } });
    if (existing) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(args.password, 10);
    const admin = await this.prisma.admin.create({
      data: { email, name: args.name, passwordHash, role: args.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return admin;
  }

  async update(
    actingAdminId: string,
    targetId: string,
    args: UpdateAdminArgs,
  ) {
    const target = await this.prisma.admin.findUnique({
      where: { id: targetId },
    });
    if (!target) throw new NotFoundException("Admin not found");

    // Prevent demoting yourself — would lock you out of management
    if (
      actingAdminId === targetId &&
      args.role &&
      args.role !== target.role &&
      args.role === "STAFF"
    ) {
      throw new ForbiddenException("Cannot demote yourself");
    }

    const data: any = {};
    if (args.name?.trim()) data.name = args.name.trim();
    if (args.role) data.role = args.role;
    if (args.password) {
      if (args.password.length < 8)
        throw new BadRequestException("Password must be at least 8 characters");
      data.passwordHash = await bcrypt.hash(args.password, 10);
    }

    return this.prisma.admin.update({
      where: { id: targetId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async remove(actingAdminId: string, targetId: string) {
    if (actingAdminId === targetId)
      throw new ForbiddenException("Cannot delete yourself");
    const target = await this.prisma.admin.findUnique({
      where: { id: targetId },
    });
    if (!target) throw new NotFoundException("Admin not found");

    // Prevent deleting the last SUPER_ADMIN — would lock everyone out
    if (target.role === "SUPER_ADMIN") {
      const superCount = await this.prisma.admin.count({
        where: { role: "SUPER_ADMIN" },
      });
      if (superCount <= 1)
        throw new ForbiddenException(
          "Cannot delete the last SUPER_ADMIN — promote another admin first",
        );
    }

    await this.prisma.admin.delete({ where: { id: targetId } });
    return { ok: true };
  }
}
