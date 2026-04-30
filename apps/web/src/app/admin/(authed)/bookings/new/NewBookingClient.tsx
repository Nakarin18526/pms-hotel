"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function NewBookingClient({ roomTypes }: { roomTypes: any[] }) {
  const { data: session } = useSession();
  const router = useRouter();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const today = new Date();
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState(format(addDays(today, 1), "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState(
    format(addDays(today, 2), "yyyy-MM-dd"),
  );
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [status, setStatus] = useState("CONFIRMED");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/admin/bookings`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          roomTypeId,
          checkIn,
          checkOut,
          guestName,
          guestEmail,
          guestPhone,
          status,
          paymentStatus,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message ?? (await r.text()));
      }
      const data = await r.json();
      router.push(`/admin/bookings/${data.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-6 space-y-4">
      <div>
        <label className="label">ประเภทห้อง</label>
        <select
          value={roomTypeId}
          onChange={(e) => setRoomTypeId(e.target.value)}
          required
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
          <label className="label">Check-in</label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
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
            required
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label">ชื่อแขก</label>
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
          className="input"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">อีเมล</label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">เบอร์โทร</label>
          <input
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            required
            className="input"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">สถานะการจอง</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input"
          >
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>
        <div>
          <label className="label">สถานะการชำระ</label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="input"
          >
            <option value="UNPAID">UNPAID</option>
            <option value="PAID">PAID</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-md text-sm border bg-red-50 text-red-700 border-red-200">
          {error}
          {error.includes("Rates not set") && (
            <div className="mt-1 text-xs">
              → ต้องตั้งราคาห้องนี้ในช่วงวันที่เลือกก่อน ที่ Rate Calendar
            </div>
          )}
        </div>
      )}

      <button className="btn-primary" disabled={busy}>
        {busy ? "กำลังสร้าง..." : "สร้างการจอง"}
      </button>
    </form>
  );
}
