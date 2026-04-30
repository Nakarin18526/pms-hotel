import { auth } from "@/auth";
import { redirect } from "next/navigation";

export type AdminRole = "SUPER_ADMIN" | "STAFF";

export async function getAdminRole(): Promise<AdminRole> {
  const session = await auth();
  return ((session?.user as any)?.adminRole ?? "SUPER_ADMIN") as AdminRole;
}

/**
 * Use at the top of admin pages that should only be accessible to SUPER_ADMIN.
 * STAFF admins are redirected to /admin (the Bookings page they can use).
 */
export async function requireSuperAdmin() {
  const role = await getAdminRole();
  if (role !== "SUPER_ADMIN") {
    redirect("/admin");
  }
}
