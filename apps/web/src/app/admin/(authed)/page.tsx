import { adminApi } from "@/lib/server-api";
import { formatDate, formatPrice } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: {
    status?: string;
    checkInFrom?: string;
    checkInTo?: string;
    q?: string;
  };
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  const qs = new URLSearchParams();
  if (searchParams.status) qs.set("status", searchParams.status);
  if (searchParams.checkInFrom) qs.set("checkInFrom", searchParams.checkInFrom);
  if (searchParams.checkInTo) qs.set("checkInTo", searchParams.checkInTo);
  if (searchParams.q) qs.set("q", searchParams.q);

  const [bookings, allBookings] = await Promise.all([
    adminApi<any[]>(`/api/admin/bookings${qs.toString() ? `?${qs}` : ""}`),
    // for stats we want unfiltered
    adminApi<any[]>("/api/admin/bookings"),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const stats = {
    pendingSlip: allBookings.filter(
      (b) => b.paymentStatus === "AWAITING_VERIFICATION",
    ).length,
    upcoming: allBookings.filter(
      (b) => b.status === "CONFIRMED" && new Date(b.checkIn) >= today,
    ).length,
    todayCheckIn: allBookings.filter(
      (b) =>
        b.status === "CONFIRMED" &&
        String(b.checkIn).slice(0, 10) === today.toISOString().slice(0, 10),
    ).length,
    todayCheckOut: allBookings.filter(
      (b) =>
        // Either marked CHECKED_OUT today, or scheduled to check out today
        (b.status === "CONFIRMED" &&
          String(b.checkOut).slice(0, 10) === today.toISOString().slice(0, 10)) ||
        (b.status === "CHECKED_OUT" &&
          b.checkedOutAt &&
          new Date(b.checkedOutAt).toISOString().slice(0, 10) ===
            today.toISOString().slice(0, 10)),
    ).length,
    totalRevenue: allBookings
      .filter((b) => b.paymentStatus === "PAID")
      .reduce((s, b) => s + Number(b.totalPrice), 0),
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="font-serif text-3xl">Bookings</h1>
        <div className="flex gap-2">
          <Link href="/admin/calendar" className="btn-secondary">
            📅 Calendar
          </Link>
          <Link href="/admin/bookings/new" className="btn-primary">
            + Manual Booking
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat
          label="รอตรวจสลิป"
          value={stats.pendingSlip}
          tone={stats.pendingSlip > 0 ? "purple" : "neutral"}
          href="/admin?status=&"
        />
        <Stat label="เช็คอินวันนี้" value={stats.todayCheckIn} tone="brand" />
        <Stat
          label="เช็คเอาต์วันนี้"
          value={stats.todayCheckOut}
          tone="neutral"
        />
        <Stat label="กำลังเข้าพัก" value={stats.upcoming} tone="neutral" />
        <Stat
          label="รายได้รวม"
          value={formatPrice(stats.totalRevenue)}
          tone="emerald"
        />
      </div>

      {/* Filters */}
      <form className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label">ค้นหา</label>
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="เลขห้อง / ชื่อแขก / อีเมล / booking ID"
            className="input"
          />
        </div>
        <div>
          <label className="label">สถานะ</label>
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="input"
          >
            <option value="">— ทั้งหมด —</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CHECKED_OUT">CHECKED OUT</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div>
          <label className="label">Check-in จาก</label>
          <input
            type="date"
            name="checkInFrom"
            defaultValue={searchParams.checkInFrom ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">Check-in ถึง</label>
          <input
            type="date"
            name="checkInTo"
            defaultValue={searchParams.checkInTo ?? ""}
            className="input"
          />
        </div>
        <button className="btn-primary">ค้นหา</button>
        <Link href="/admin" className="btn-secondary">
          Reset
        </Link>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr className="text-left">
                <th className="p-3">Booking</th>
                <th className="p-3">Guest</th>
                <th className="p-3">Room Type</th>
                <th className="p-3">Room #</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    ไม่มีการจอง
                  </td>
                </tr>
              )}
              {bookings.map((b) => (
                <tr key={b.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs num">{b.id.slice(0, 12)}…</td>
                  <td className="p-3">
                    <div className="font-medium">{b.guestName}</div>
                    <div className="text-xs text-slate-500">{b.guestEmail}</div>
                  </td>
                  <td className="p-3">{b.roomType?.name}</td>
                  <td className="p-3">
                    {b.roomNumber ? (
                      <span className="num font-semibold text-brand-800 bg-brand-50 px-2 py-0.5 rounded">
                        {b.roomNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="p-3 text-xs num">
                    {formatDate(b.checkIn)} →<br />
                    {formatDate(b.checkOut)}
                  </td>
                  <td className="p-3 price">{formatPrice(Number(b.totalPrice))}</td>
                  <td className="p-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="p-3">
                    <PaymentBadge status={b.paymentStatus} />
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="text-brand-700 hover:text-brand-900 text-xs font-medium"
                    >
                      เปิด →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: number | string;
  tone: "purple" | "brand" | "emerald" | "neutral";
  href?: string;
}) {
  const colors = {
    purple: "border-purple-200 bg-purple-50/50",
    brand: "border-brand-200 bg-brand-50/50",
    emerald: "border-emerald-200 bg-emerald-50/50",
    neutral: "border-slate-200 bg-white",
  }[tone];
  const inner = (
    <div className={`card p-4 border ${colors}`}>
      <div className="text-xs text-slate-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="font-serif text-2xl mt-1 num">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "CONFIRMED")
    return <span className="badge-success">CONFIRMED</span>;
  if (status === "CHECKED_OUT")
    return (
      <span className="badge bg-slate-200 text-slate-700 ring-1 ring-slate-600/20">
        CHECKED OUT
      </span>
    );
  if (status === "CANCELLED")
    return <span className="badge-danger">CANCELLED</span>;
  return <span className="badge-warning">PENDING</span>;
}

function PaymentBadge({ status }: { status: string }) {
  if (status === "PAID") return <span className="badge-success">PAID</span>;
  if (status === "AWAITING_VERIFICATION")
    return (
      <span className="badge bg-purple-50 text-purple-700 ring-1 ring-purple-600/20">
        SLIP UPLOADED
      </span>
    );
  return <span className="badge-neutral">UNPAID</span>;
}
