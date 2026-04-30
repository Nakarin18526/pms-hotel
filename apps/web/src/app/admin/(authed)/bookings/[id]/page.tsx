import { adminApi } from "@/lib/server-api";
import Link from "next/link";
import BookingEditor from "./BookingEditor";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function AdminBookingDetail({ params }: Props) {
  const [booking, roomTypes] = await Promise.all([
    adminApi<any>(`/api/admin/bookings/${params.id}`),
    adminApi<any[]>("/api/room-types"),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl">
          Booking #{booking.id.slice(0, 8)}
        </h1>
        <Link href="/admin" className="text-sm text-slate-600">
          ← Back
        </Link>
      </div>
      <BookingEditor initial={booking} roomTypes={roomTypes} />
    </div>
  );
}
