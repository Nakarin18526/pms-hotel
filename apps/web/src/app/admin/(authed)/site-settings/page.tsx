import { adminApi } from "@/lib/server-api";
import Link from "next/link";
import SiteSettingsForm from "./SiteSettingsForm";
import { requireSuperAdmin } from "@/lib/admin-role";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  await requireSuperAdmin();
  const setting = await adminApi<any>("/api/admin/site-settings");
  return (
    <div className="max-w-3xl">
      <Link
        href="/admin"
        className="inline-flex items-center text-sm text-slate-600 hover:text-brand-700 mb-3"
      >
        ← Bookings
      </Link>
      <h1 className="font-serif text-3xl mb-2">เนื้อหาเว็บไซต์</h1>
      <p className="text-sm text-slate-600 mb-6">
        ปรับเปลี่ยนชื่อโรงแรม ข้อความบนหน้าแรก ฟีเจอร์ ที่อยู่ และนโยบายต่าง ๆ
        — แขกจะเห็นการเปลี่ยนแปลงทันทีเมื่อโหลดหน้าใหม่
      </p>
      <SiteSettingsForm initial={setting} />
    </div>
  );
}
