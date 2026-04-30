import { adminApi } from "@/lib/server-api";
import Link from "next/link";
import NewBookingClient from "./NewBookingClient";

export const dynamic = "force-dynamic";

export default async function NewBookingPage() {
  const roomTypes = await adminApi<any[]>("/api/room-types");
  return (
    <div className="max-w-xl">
      <Link
        href="/admin"
        className="inline-flex items-center text-sm text-slate-600 hover:text-brand-700 mb-3"
      >
        ← Bookings
      </Link>
      <h1 className="font-serif text-3xl mb-2">สร้างการจองด้วยตนเอง</h1>
      <p className="text-sm text-slate-600 mb-6">
        สำหรับ walk-in / โทรจอง — ระบบจะเช็ค availability + ราคารายคืนอัตโนมัติ
      </p>
      {roomTypes.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-slate-600 mb-4">
            ยังไม่มีประเภทห้องในระบบ — สร้างห้องก่อน
          </p>
          <Link href="/admin/room-types" className="btn-primary">
            ไปที่ Room Types
          </Link>
        </div>
      ) : (
        <NewBookingClient roomTypes={roomTypes} />
      )}
    </div>
  );
}
