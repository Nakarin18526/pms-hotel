import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

export type AdminRole = "SUPER_ADMIN" | "STAFF";

export interface JwtPayload {
  sub: string;
  email: string;
  name?: string | null;
  role: "GUEST" | "ADMIN";
  /** Only present when role === "ADMIN" */
  adminRole?: AdminRole;
}

/**
 * Backwards-compat fallback for admins created before the role column
 * existed. SUPER_ADMIN is the prod-safe default; this set gives early
 * STAFF access to specific emails before they have a real DB role row.
 */
const LEGACY_STAFF_EMAILS = new Set<string>(["admin@gmail.com"]);
export function deriveAdminRole(
  admin: { email: string; role?: AdminRole | null },
): AdminRole {
  if (admin.role === "STAFF" || admin.role === "SUPER_ADMIN") return admin.role;
  if (LEGACY_STAFF_EMAILS.has(admin.email.toLowerCase())) return "STAFF";
  return "SUPER_ADMIN";
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registerGuest(
    email: string,
    password: string,
    name?: string,
    phone?: string,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("Email already registered");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, name, phone, provider: "EMAIL" },
    });
    return this.issueToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: "GUEST",
    });
  }

  async loginGuest(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException("Invalid credentials");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return this.issueToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: "GUEST",
    });
  }

  async loginOrCreateGoogleGuest(email: string, name?: string) {
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { email, name, provider: "GOOGLE" },
      });
    }
    return this.issueToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: "GUEST",
    });
  }

  async loginAdmin(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) throw new UnauthorizedException("Invalid credentials");
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return this.issueToken({
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: "ADMIN",
      adminRole: deriveAdminRole(admin),
    });
  }

  async me(payload: JwtPayload) {
    if (payload.role === "ADMIN") {
      const admin = await this.prisma.admin.findUnique({
        where: { id: payload.sub },
      });
      if (!admin) throw new UnauthorizedException();
      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: "ADMIN" as const,
        adminRole: deriveAdminRole(admin),
      };
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: "GUEST" as const,
    };
  }

  private issueToken(payload: JwtPayload) {
    const token = this.jwt.sign(payload);
    return {
      token,
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name ?? null,
        role: payload.role,
      },
    };
  }
}
