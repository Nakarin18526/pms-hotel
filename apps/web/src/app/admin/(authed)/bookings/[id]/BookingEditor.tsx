"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import SlipVerifier from "./SlipVerifier";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function BookingEditor({
  initial,
  roomTypes,
}: {
  initial: any;
  roomTypes: any[];
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [booking, setBooking] = useState(initial);
  const [checkIn, setCheckIn] = useState(String(booking.checkIn).slice(0, 10));
  const [checkOut, setCheckOut] = useState(
    String(booking.checkOut).slice(0, 10),
  );
  const [roomTypeId, setRoomTypeId] = useState(booking.roomTypeId);
  const [guestName, setGuestName] = useState(booking.guestName);
  const [guestPhone, setGuestPhone] = useState(booking.guestPhone);
  const [roomNumber, setRoomNumber] = useState(booking.roomNumber ?? "");

  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  async function call(
    label: string,
    url: string,
    method: string = "POST",
    body?: any,
  ) {
    setBusy(label);
    setMsg(null);
    try {
      const r = await fetch(`${API}${url}`, {
        method,
        headers: {
          ...(body ? { "content-type": "application/json" } : {}),
          authorization: `Bearer ${apiToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message ?? (await r.text()));
      }
      const data = await r.json();
      setBooking(data);
      setMsg({ kind: "success", text: "✓ บันทึกสำเร็จ" });
      router.refresh();
    } catch (e: any) {
      setMsg({ kind: "error", text: e.message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Slip verification panel */}
      {booking.slipUrl && (
        <div className="card p-6 border-purple-200 bg-purple-50/30">
          <h2 className="font-serif text-xl mb-1">ตรวจสอบสลิปการโอน</h2>
          <p className="text-sm text-slate-600 mb-4">
            ตรวจสอบว่าสลิปและจำนวนเงินตรงกันก่อนยืนยัน
          </p>
          <div className="grid md:grid-cols-2 gap-5 mb-4">
            <a
              href={booking.slipUrl}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <img
                src={booking.slipUrl}
                alt="slip"
                className="w-full rounded-lg border border-slate-200 hover:opacity-90"
              />
            </a>
            <div className="text-sm space-y-2">
              <div>
                <div className="text-slate-500 text-xs uppercase tracking-wider">
                  ยอดที่ต้องชำระ
                </div>
                <div className="price text-2xl text-brand-800">
                  {formatPrice(Number(booking.totalPrice))}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs uppercase tracking-wider">
                  อัปโหลดเมื่อ
                </div>
                <div>
                  {booking.slipUploadedAt
                    ? new Date(booking.slipUploadedAt).toLocaleString("th-TH")
                    : "-"}
                </div>
              </div>
              {booking.slipVerifiedAt && (
                <div className="text-emerald-700">
                  ✓ ยืนยันแล้วเมื่อ{" "}
                  {new Date(booking.slipVerifiedAt).toLocaleString("th-TH")}
                </div>
              )}
            </div>
          </div>

          {booking.paymentStatus === "AWAITING_VERIFICATION" && (
            <SlipVerifier
              bookingId={booking.id}
              expected={Number(booking.totalPrice)}
            />
          )}
        </div>
      )}

      {/* Edit form */}
      <div className="card p-6">
        <h2 className="font-serif text-xl mb-4">แก้ไขข้อมูลการจอง</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">ประเภทห้อง</label>
            <select
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              className="input"
            >
              {roomTypes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">ชื่อแขก</label>
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">เบอร์โทร</label>
              <input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">
              เลขห้องที่จัดให้แขก
              <span className="ml-2 text-[10px] text-slate-400 normal-case tracking-normal">
                (เช่น 101, A-204 — ปล่อยว่างได้)
              </span>
            </label>
            <input
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="input num"
              placeholder="101"
            />
          </div>
          <button
            onClick={() =>
              call("save", `/api/admin/bookings/${booking.id}`, "PUT", {
                checkIn,
                checkOut,
                roomTypeId,
                guestName,
                guestPhone,
                roomNumber,
              })
            }
            disabled={busy !== null}
            className="btn-primary"
          >
            {busy === "save" ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>

      {/* Status panel */}
      <div className="card p-6">
        <h2 className="font-serif text-xl mb-3">สถานะ</h2>
        <div className="text-sm space-y-1.5 mb-4">
          <Row k="ยอดรวม" v={<b className="price">{formatPrice(Number(booking.totalPrice))}</b>} />
          <Row k="อีเมล" v={booking.guestEmail} />
          <Row k="สถานะการจอง" v={<StatusBadge status={booking.status} />} />
          <Row
            k="สถานะการชำระ"
            v={
              <>
                <PaymentBadge status={booking.paymentStatus} />{" "}
                <span className="text-xs text-slate-500">
                  ({booking.paymentMethod})
                </span>
              </>
            }
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          {booking.paymentStatus !== "PAID" && (
            <button
              onClick={() =>
                call(
                  "paid",
                  `/api/admin/bookings/${booking.id}/mark-paid`,
                  "POST",
                )
              }
              disabled={busy !== null}
              className="btn-secondary"
            >
              ทำเครื่องหมาย "ชำระแล้ว"
            </button>
          )}
          {booking.status === "CONFIRMED" && (
            <button
              onClick={() => {
                if (
                  !confirm(
                    "เช็คเอาต์การจองนี้? — ห้องจะถูกปลดออกจาก inventory ทันที",
                  )
                )
                  return;
                call(
                  "checkout",
                  `/api/admin/bookings/${booking.id}/check-out`,
                  "POST",
                );
              }}
              disabled={busy !== null}
              className="btn-gold"
            >
              {busy === "checkout" ? "..." : "✓ เช็คเอาต์"}
            </button>
          )}
          {booking.status !== "CANCELLED" &&
            booking.status !== "CHECKED_OUT" && (
              <button
                onClick={() => {
                  if (!confirm("ยกเลิกการจองนี้?")) return;
                  call(
                    "cancel",
                    `/api/admin/bookings/${booking.id}/cancel`,
                    "POST",
                  );
                }}
                disabled={busy !== null}
                className="btn-danger"
              >
                ยกเลิกการจอง
              </button>
            )}
        </div>

        {booking.checkedOutAt && (
          <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            ✓ เช็คเอาต์เมื่อ{" "}
            {new Date(booking.checkedOutAt).toLocaleString("th-TH")}
          </div>
        )}
      </div>

      {msg && (
        <div
          className={
            "px-3 py-2 rounded-md text-sm border " +
            (msg.kind === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200")
          }
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex">
      <div className="w-32 text-slate-500">{k}</div>
      <div>{v}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "CONFIRMED") return <span className="badge-success">CONFIRMED</span>;
  if (status === "CHECKED_OUT")
    return (
      <span className="badge bg-slate-200 text-slate-700 ring-1 ring-slate-600/20">
        CHECKED OUT
      </span>
    );
  if (status === "CANCELLED") return <span className="badge-danger">CANCELLED</span>;
  return <span className="badge-warning">PENDING</span>;
}

function PaymentBadge({ status }: { status: string }) {
  if (status === "PAID") return <span className="badge-success">PAID</span>;
  if (status === "AWAITING_VERIFICATION")
    return (
      <span className="badge bg-purple-50 text-purple-700 ring-1 ring-purple-600/20">
        AWAITING VERIFICATION
      </span>
    );
  return <span className="badge-neutral">UNPAID</span>;
}
