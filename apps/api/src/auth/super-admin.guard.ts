import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

/**
 * Allows only admins with adminRole = "SUPER_ADMIN".
 * STAFF admins (e.g. admin@gmail.com) are restricted to Bookings + Calendar
 * — they cannot manage Room Types, Rates, Payment Settings, or Site Content.
 *
 * Use AFTER JwtAuthGuard so req.user is populated.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || user.role !== "ADMIN" || user.adminRole !== "SUPER_ADMIN") {
      throw new ForbiddenException(
        "STAFF admin cannot perform this action — SUPER_ADMIN required",
      );
    }
    return true;
  }
}
