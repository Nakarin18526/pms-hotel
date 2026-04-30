import { adminApi } from "@/lib/server-api";
import Link from "next/link";
import RatesClient from "./RatesClient";
import { requireSuperAdmin } from "@/lib/admin-role";

export const dynamic = "force-dynamic";

export default async function RatesPage() {
  await requireSuperAdmin();
  const roomTypes = await adminApi<any[]>("/api/room-types");
  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center text-sm text-slate-600 hover:text-brand-700 mb-3"
      >
        ← Bookings
      </Link>
      <h1 className="font-serif text-3xl mb-2">Rate Calendar</h1>
      <p className="text-sm text-slate-600 mb-6">
        ตั้งราคาห้องพักรายคืน — ถ้าวันไหนไม่มีราคา แขกจะจองวันนั้นไม่ได้
      </p>
      {roomTypes.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-slate-600 mb-4">
            ยังไม่มีประเภทห้องในระบบ — สร้างห้องก่อนแล้วค่อยตั้งราคา
          </p>
          <Link href="/admin/room-types" className="btn-primary">
            ไปที่ Room Types
          </Link>
        </div>
      ) : (
        <RatesClient roomTypes={roomTypes} />
      )}
    </div>
  );
}
