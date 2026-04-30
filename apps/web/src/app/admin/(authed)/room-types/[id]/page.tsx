import { adminApi } from "@/lib/server-api";
import Link from "next/link";
import EditRoomTypeForm from "./EditRoomTypeForm";
import RoomRateManager from "@/components/RoomRateManager";
import { requireSuperAdmin } from "@/lib/admin-role";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function EditRoomTypePage({ params }: Props) {
  await requireSuperAdmin();
  const rt = await adminApi<any>(`/api/room-types/${params.id}`);
  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/room-types"
        className="inline-flex items-center text-sm text-slate-600 hover:text-brand-700 mb-3"
      >
        ← Room Types
      </Link>
      <h1 className="font-serif text-3xl mb-2">{rt.name}</h1>
      <p className="text-sm text-slate-600 mb-6">
        จัดการข้อมูลห้อง รูปภาพ และราคารายคืนทั้งหมดในหน้าเดียว
      </p>

      {/* --- Tab-like sections stacked --- */}
      <Section title="ข้อมูลห้อง" subtitle="ชื่อ คำอธิบาย จำนวน รูปภาพ">
        <EditRoomTypeForm initial={rt} />
      </Section>

      <Section
        title="ราคารายคืน"
        subtitle="ตั้งราคาเป็นช่วงวัน — ถ้าวันไหนไม่มีราคา แขกจะจองวันนั้นไม่ได้"
      >
        <RoomRateManager roomTypeId={rt.id} roomTypeName={rt.name} />
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6 mb-5">
      <div className="mb-4">
        <h2 className="font-serif text-xl">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
