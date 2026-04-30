import { adminApi } from "@/lib/server-api";
import Link from "next/link";
import PaymentSettingsForm from "./PaymentSettingsForm";
import { requireSuperAdmin } from "@/lib/admin-role";

export const dynamic = "force-dynamic";

export default async function PaymentSettingsPage() {
  await requireSuperAdmin();
  const setting = await adminApi<any>("/api/admin/payment-settings");

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin"
        className="inline-flex items-center text-sm text-slate-600 hover:text-brand-700 mb-3"
      >
        ← Bookings
      </Link>
      <h1 className="font-serif text-3xl mb-2">Payment Settings</h1>
      <p className="text-sm text-slate-600 mb-6">
        ตั้งค่าวิธีรับเงินสำหรับการจอง — แขกจะเห็นข้อมูลตามที่ตั้งไว้นี้
      </p>
      <PaymentSettingsForm initial={setting} />
    </div>
  );
}
