/**
 * Global setup for integration tests.
 *
 * Forces DATABASE_URL to point at the test database (defaults to pms_test
 * on the same Postgres instance) and runs prisma migrate deploy so the
 * schema is fresh before any test runs.
 */
import { execSync } from "child_process";

export default async function globalSetup() {
  const testDbUrl =
    process.env.DATABASE_URL_TEST ??
    "postgresql://pms:pms@localhost:5432/pms_test?schema=public";
  process.env.DATABASE_URL = testDbUrl;

  // Apply migrations on the test DB. Falls back to db push if no migrations
  // exist yet (clean dev environment).
  try {
    execSync("pnpm prisma migrate deploy", {
      cwd: __dirname + "/..",
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: "inherit",
    });
  } catch {
    // No deployable migrations — sync schema directly
    execSync("pnpm prisma db push --skip-generate --accept-data-loss", {
      cwd: __dirname + "/..",
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: "inherit",
    });
  }

  console.log(`\n[integration] using test DB: ${testDbUrl}\n`);
}
