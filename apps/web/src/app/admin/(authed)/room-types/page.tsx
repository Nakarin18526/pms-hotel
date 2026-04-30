import { adminApi } from "@/lib/server-api";
import Link from "next/link";
import RoomTypeCreator from "./RoomTypeCreator";
import DeleteButton from "./DeleteButton";
import { addDays, format } from "date-fns";
import { requireSuperAdmin } from "@/lib/admin-role";

export const dynamic = "force-dynamic";

export default async function RoomTypesPage() {
  await requireSuperAdmin();
  const list = await adminApi<any[]>("/api/room-types");

  // For each room, count how many of the next 90 days have rates set
  const today = new Date();
  const horizon = format(today, "yyyy-MM-dd");
  const horizonEnd = format(addDays(today, 89), "yyyy-MM-dd");
  const ratesByRoom = await Promise.all(
    list.map(async (rt) => {
      try {
        const r = await adminApi<any[]>(
          `/api/room-types/${rt.id}/rates?startDate=${horizon}&endDate=${horizonEnd}`,
        );
        return r.length;
      } catch {
        return 0;
      }
    }),
  );

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center text-sm text-slate-600 hover:text-brand-700 mb-3"
      >
        ← Bookings
      </Link>
      <h1 className="font-serif text-3xl mb-2">Room Types</h1>
      <p className="text-sm text-slate-600 mb-6">
        จัดการประเภทห้อง รูปภาพ และราคารายคืน — กด "เปิด" เพื่อแก้ไขและตั้งราคา
      </p>

      <RoomTypeCreator />

      <div className="space-y-3 mt-8">
        {list.map((rt, i) => {
          const count = ratesByRoom[i];
          return (
            <div
              key={rt.id}
              className="card p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {rt.imageUrls?.[0] ? (
                  <img
                    src={rt.imageUrls[0]}
                    alt=""
                    className="w-20 h-16 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-16 bg-slate-100 rounded flex-shrink-0 flex items-center justify-center text-slate-400 text-xs">
                    no image
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{rt.name}</div>
                  <div className="text-sm text-slate-500 truncate">
                    {rt.totalUnits} units · max {rt.maxOccupancy} guests ·{" "}
                    {rt.imageUrls?.length ?? 0} images
                  </div>
                  <div className="mt-1.5">
                    <RateBadge count={count} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-center flex-shrink-0">
                <Link
                  href={`/admin/room-types/${rt.id}`}
                  className="btn-primary text-sm"
                >
                  เปิด / ตั้งราคา
                </Link>
                <DeleteButton id={rt.id} />
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="card p-10 text-center text-slate-500">
            ยังไม่มีห้องในระบบ — สร้างได้จากฟอร์มด้านบน
          </div>
        )}
      </div>
    </div>
  );
}

function RateBadge({ count }: { count: number }) {
  if (count === 0)
    return (
      <span className="badge bg-red-50 text-red-700 ring-1 ring-red-600/20">
        ⚠ ยังไม่มีราคา 90 วันข้างหน้า
      </span>
    );
  if (count < 30)
    return (
      <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-600/20">
        ตั้งราคาแล้ว {count}/90 วัน
      </span>
    );
  if (count < 90)
    return (
      <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-600/20">
        ตั้งราคาแล้ว {count}/90 วัน
      </span>
    );
  return (
    <span className="badge-success">✓ ตั้งราคาครบ 90 วันข้างหน้า</span>
  );
}
