/**
 * Shared test-database helpers.
 *
 * - `prisma`: a singleton Prisma client pointed at the test DB
 * - `truncateAll(prisma)`: wipe all data between tests (FK-safe via CASCADE)
 *
 * Each integration spec calls `truncateAll` in beforeEach so tests are
 * fully isolated — no shared state, no order dependence.
 */
import { PrismaClient } from "@prisma/client";

let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
      log: ["error"],
    });
  }
  return _prisma;
}

export async function truncateAll(prisma: PrismaClient) {
  // Order matters only for diagnostics; CASCADE handles FK rows.
  await prisma.$executeRawUnsafe(`
    TRUNCATE
      "Booking",
      "RoomRate",
      "RoomType",
      "User",
      "Admin",
      "PaymentSetting",
      "SiteSetting"
    RESTART IDENTITY CASCADE
  `);
}

/** Build a Date at UTC midnight for "yyyy-mm-dd" — matches our DB date semantics. */
export function utcDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
