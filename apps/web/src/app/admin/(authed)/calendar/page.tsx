import { adminApi } from "@/lib/server-api";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO,
  addMonths,
  subMonths,
  differenceInCalendarDays,
} from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { month?: string };
}

export default async function CalendarPage({ searchParams }: Props) {
  const month = searchParams.month
    ? parseISO(searchParams.month + "-01")
    : startOfMonth(new Date());
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch a wide window — 3 months back, 6 months forward
  // so we can show "X bookings outside this view" hints.
  const wideFrom = format(subMonths(monthStart, 3), "yyyy-MM-dd");
  const wideTo = format(addMonths(monthEnd, 6), "yyyy-MM-dd");

  const [roomTypes, allBookings] = await Promise.all([
    adminApi<any[]>("/api/room-types"),
    adminApi<any[]>(
      `/api/admin/bookings?checkInFrom=${wideFrom}&checkInTo=${wideTo}`,
    ),
  ]);

  const prevMonth = format(subMonths(monthStart, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthStart, 1), "yyyy-MM");
  const todayMonth = format(startOfMonth(new Date()), "yyyy-MM");
  const isViewingCurrentMonth = format(monthStart, "yyyy-MM") === todayMonth;

  const cellW = 80;

  // Active bookings (not cancelled)
  const active = allBookings.filter((b) => b.status !== "CANCELLED");

  // Bookings whose stay overlaps the visible month
  const inMonth = active.filter((b) => {
    const ci = new Date(b.checkIn);
    const co = new Date(b.checkOut);
    return ci <= monthEnd && co > monthStart;
  });

  // Bookings outside the current month (but in our wide fetch)
  const outsideMonth = active.length - inMonth.length;

  // Group bookings overlapping current month, by room type
  const byRoom = new Map<string, any[]>();
  for (const b of inMonth) {
    const arr = byRoom.get(b.roomTypeId) ?? [];
    arr.push(b);
    byRoom.set(b.roomTypeId, arr);
  }

  // Lane assignment for overlapping bookings
  function computeLanes(items: any[]) {
    const sorted = [...items].sort(
      (a, b) => +new Date(a.checkIn) - +new Date(b.checkIn),
    );
    const lanes: Date[] = [];
    return sorted.map((b) => {
      const ci = new Date(b.checkIn);
      const co = new Date(b.checkOut);
      let lane = lanes.findIndex((freeFrom) => freeFrom <= ci);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(co);
      } else {
        lanes[lane] = co;
      }
      return { booking: b, lane };
    });
  }

  // Find next month that has bookings (forward) — for "jump to" hint
  const nextMonthWithBookings = (() => {
    if (outsideMonth === 0) return null;
    for (let i = 1; i <= 6; i++) {
      const mStart = startOfMonth(addMonths(monthStart, i));
      const mEnd = endOfMonth(mStart);
      const has = active.find((b) => {
        const ci = new Date(b.checkIn);
        const co = new Date(b.checkOut);
        return ci <= mEnd && co > mStart;
      });
      if (has) return format(mStart, "yyyy-MM");
    }
    return null;
  })();

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center text-sm text-slate-600 hover:text-brand-700 mb-3"
      >
        ← Bookings
      </Link>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl">Bookings Calendar</h1>
          <p className="text-sm text-slate-600 mt-1">
            <span className="num font-medium">{inMonth.length}</span> active booking
            {inMonth.length !== 1 ? "s" : ""} in {format(monthStart, "MMM yyyy")}
            {outsideMonth > 0 && (
              <>
                {" · "}
                <span className="text-slate-500">
                  <span className="num">{outsideMonth}</span> outside this view
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/calendar?month=${prevMonth}`}
            className="btn-secondary text-sm"
          >
            ← {format(subMonths(monthStart, 1), "MMM")}
          </Link>
          <div className="px-4 py-2 font-serif text-lg num">
            {format(monthStart, "MMMM yyyy")}
          </div>
          <Link
            href={`/admin/calendar?month=${nextMonth}`}
            className="btn-secondary text-sm"
          >
            {format(addMonths(monthStart, 1), "MMM")} →
          </Link>
          {!isViewingCurrentMonth && (
            <Link
              href={`/admin/calendar?month=${todayMonth}`}
              className="btn-primary text-sm"
            >
              วันนี้
            </Link>
          )}
        </div>
      </div>

      {/* Hint: bookings in other months */}
      {nextMonthWithBookings && (
        <div className="mb-4 px-4 py-2 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-center justify-between">
          <span>
            📅 มีการจอง <span className="num font-semibold">{outsideMonth}</span>{" "}
            รายการในเดือนอื่น
          </span>
          <Link
            href={`/admin/calendar?month=${nextMonthWithBookings}`}
            className="text-amber-800 hover:text-amber-900 underline text-sm"
          >
            ไป{" "}
            {format(parseISO(nextMonthWithBookings + "-01"), "MMMM yyyy")} →
          </Link>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-600 mb-4 flex-wrap">
        <Legend color="bg-emerald-500" label="Confirmed + Paid" />
        <Legend color="bg-brand-600" label="Confirmed (unpaid)" />
        <Legend color="bg-purple-500" label="กำลังดำเนินการ (slip uploaded)" />
        <Legend color="bg-amber-500" label="Pending (no slip)" />
        <Legend color="bg-slate-400" label="Checked out" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: 200 + cellW * days.length }}>
            {/* Header row — days */}
            <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
              <div className="w-[200px] flex-shrink-0 px-3 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider border-r border-slate-200">
                Room Type
              </div>
              <div className="flex">
                {days.map((d) => {
                  const isWeekend = [0, 6].includes(d.getDay());
                  const isToday =
                    format(d, "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd");
                  return (
                    <div
                      key={d.toISOString()}
                      style={{ width: cellW }}
                      className={
                        "flex-shrink-0 px-2 py-2 text-center border-r border-slate-200 text-xs " +
                        (isWeekend ? "bg-slate-100/60 " : "") +
                        (isToday ? "bg-gold-50 " : "")
                      }
                    >
                      <div
                        className={
                          "text-[10px] uppercase " +
                          (isWeekend ? "text-rose-600" : "text-slate-400")
                        }
                      >
                        {format(d, "EEE")}
                      </div>
                      <div
                        className={
                          "font-semibold num " +
                          (isToday
                            ? "text-gold-700"
                            : isWeekend
                              ? "text-rose-700"
                              : "text-slate-800")
                        }
                      >
                        {format(d, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Room rows */}
            {roomTypes.map((rt) => {
              const items = byRoom.get(rt.id) ?? [];
              const positioned = computeLanes(items);
              const laneCount =
                positioned.length === 0
                  ? 1
                  : Math.max(...positioned.map((p) => p.lane)) + 1;
              const rowH = 44;
              const rowHeight = laneCount * rowH + 8;

              return (
                <div
                  key={rt.id}
                  className="flex border-b border-slate-200 last:border-b-0"
                >
                  <div className="w-[200px] flex-shrink-0 p-3 border-r border-slate-200 bg-white flex flex-col justify-center">
                    <div className="font-medium text-sm">{rt.name}</div>
                    <div className="text-xs text-slate-500">
                      <span className="num">{rt.totalUnits}</span> units ·{" "}
                      <span className="num font-medium text-brand-700">
                        {items.length}
                      </span>{" "}
                      booked
                    </div>
                  </div>
                  <div
                    className="relative flex-1"
                    style={{
                      height: rowHeight,
                      backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${cellW - 1}px, rgb(226 232 240 / 0.6) ${cellW - 1}px, rgb(226 232 240 / 0.6) ${cellW}px)`,
                    }}
                  >
                    {/* weekend stripes */}
                    {days.map((d, i) => {
                      const isWeekend = [0, 6].includes(d.getDay());
                      if (!isWeekend) return null;
                      return (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 bg-slate-50/50"
                          style={{ left: i * cellW, width: cellW }}
                        />
                      );
                    })}

                    {positioned.map(({ booking, lane }) => {
                      const ci = new Date(booking.checkIn);
                      const co = new Date(booking.checkOut);
                      const visibleStart = ci < monthStart ? monthStart : ci;
                      const visibleEnd = co > monthEnd ? monthEnd : co;
                      const startOffset = differenceInCalendarDays(
                        visibleStart,
                        monthStart,
                      );
                      const span = differenceInCalendarDays(
                        visibleEnd,
                        visibleStart,
                      );
                      if (span <= 0) return null;
                      const left = startOffset * cellW;
                      const width = span * cellW - 4;

                      const isPaid = booking.paymentStatus === "PAID";
                      const color =
                        booking.status === "CHECKED_OUT"
                          ? "bg-slate-400 hover:bg-slate-500"
                          : booking.status === "CONFIRMED"
                            ? isPaid
                              ? "bg-emerald-500 hover:bg-emerald-600"
                              : "bg-brand-600 hover:bg-brand-700"
                            : booking.paymentStatus === "AWAITING_VERIFICATION"
                              ? "bg-purple-500 hover:bg-purple-600"
                              : "bg-amber-500 hover:bg-amber-600";

                      return (
                        <Link
                          key={booking.id}
                          href={`/admin/bookings/${booking.id}`}
                          className={
                            "group absolute rounded-md text-white text-xs px-2 py-1.5 shadow-soft cursor-pointer transition-all " +
                            color
                          }
                          style={{
                            left: left + 2,
                            width: Math.max(width, 30),
                            top: lane * 44 + 4,
                            height: 38,
                          }}
                          title={`${booking.guestName} · ${format(ci, "dd MMM")} → ${format(co, "dd MMM")} · ${Number(booking.totalPrice).toLocaleString()} ฿`}
                        >
                          <div className="font-medium truncate leading-tight">
                            {booking.guestName}
                          </div>
                          <div className="text-[10px] opacity-90 truncate leading-tight num">
                            {format(ci, "dd MMM")} → {format(co, "dd MMM")}
                          </div>
                        </Link>
                      );
                    })}

                    {items.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-300">
                        — ไม่มีการจอง —
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {roomTypes.length === 0 && (
              <div className="py-10 text-center text-slate-500 text-sm">
                ไม่มีประเภทห้อง — สร้างที่หน้า Room Types ก่อน
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded inline-block ${color}`} />
      {label}
    </div>
  );
}
