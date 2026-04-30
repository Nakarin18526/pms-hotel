import { adminApi } from "@/lib/server-api";
import { requireSuperAdmin } from "@/lib/admin-role";
import { auth } from "@/auth";
import Link from "next/link";
import AdminsClient from "./AdminsClient";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  await requireSuperAdmin();
  const session = await auth();
  const myId = (session?.user as any)?.id as string | undefined;

  const admins = await adminApi<any[]>("/api/admin/admins");
  return (
    <div className="max-w-3xl">
      <Link
        href="/admin"
        className="inline-flex items-center text-sm text-slate-600 hover:text-brand-700 mb-3"
      >
        ← Bookings
      </Link>
      <h1 className="font-serif text-3xl mb-2">Admin Accounts</h1>
      <p className="text-sm text-slate-600 mb-6">
        จัดการบัญชี admin ของระบบ — ตั้งสิทธิ์เป็น <b>SUPER_ADMIN</b>{" "}
        (จัดการได้ทุกอย่าง) หรือ <b>STAFF</b> (เฉพาะ Bookings + Calendar)
      </p>

      <AdminsClient initialAdmins={admins} currentAdminId={myId ?? ""} />
    </div>
  );
}
