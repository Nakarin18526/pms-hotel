"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  addDays,
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface RoomType {
  id: string;
  name: string;
}

export default function RatesClient({ roomTypes }: { roomTypes: RoomType[] }) {
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "");
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [rates, setRates] = useState<{ date: string; price: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  // Form state for "Set range price"
  const startStr = format(startOfMonth(month), "yyyy-MM-dd");
  const endStr = format(endOfMonth(month), "yyyy-MM-dd");
  const [rangeStart, setRangeStart] = useState(startStr);
  const [rangeEnd, setRangeEnd] = useState(endStr);
  const [price, setPrice] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const loadRates = useCallback(async () => {
    if (!roomTypeId) return;
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/api/room-types/${roomTypeId}/rates?startDate=${format(startOfMonth(month), "yyyy-MM-dd")}&endDate=${format(endOfMonth(month), "yyyy-MM-dd")}`,
      );
      if (!r.ok) throw new Error(await r.text());
      setRates(await r.json());
    } catch (e: any) {
      console.error(e);
      setRates([]);
    } finally {
      setLoading(false);
    }
  }, [roomTypeId, month]);

  useEffect(() => {
    loadRates();
    setRangeStart(format(startOfMonth(month), "yyyy-MM-dd"));
    setRangeEnd(format(endOfMonth(month), "yyyy-MM-dd"));
  }, [loadRates, month]);

  async function applyRange() {
    setSaveMsg(null);
    if (!price || Number(price) <= 0) {
      setSaveMsg({ kind: "error", text: "กรุณากรอกราคาที่มากกว่า 0" });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(
        `${API}/api/admin/room-types/${roomTypeId}/rates`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            startDate: rangeStart,
            endDate: rangeEnd,
            price: Number(price),
          }),
        },
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message ?? (await r.text()));
      }
      const data = await r.json();
      setSaveMsg({
        kind: "success",
        text: `✓ ตั้งราคาสำเร็จ ${data.updated} วัน`,
      });
      await loadRates();
    } catch (e: any) {
      setSaveMsg({ kind: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  function quickSet(days: number) {
    const today = new Date();
    setRangeStart(format(today, "yyyy-MM-dd"));
    setRangeEnd(format(addDays(today, days - 1), "yyyy-MM-dd"));
  }

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days: Date[] = [];
  for (let d = monthStart; d <= monthEnd; d = addDays(d, 1)) days.push(new Date(d));
  const map = new Map(rates.map((r) => [r.date, r.price]));

  return (
    <div className="space-y-5">
      {/* View filter */}
      <div className="card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
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
        <div>
          <label className="label">เดือน</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMonth(subMonths(month, 1))}
              className="btn-secondary px-3"
            >
              ←
            </button>
            <input
              type="month"
              value={format(month, "yyyy-MM")}
              onChange={(e) => setMonth(startOfMonth(parseISO(e.target.value + "-01")))}
              className="input"
            />
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, 1))}
              className="btn-secondary px-3"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Set range form */}
      <div className="card p-6">
        <h2 className="font-serif text-xl mb-4">ตั้งราคาเป็นช่วงวัน</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="label">วันเริ่ม</label>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">วันสิ้นสุด</label>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              min={rangeStart}
              className="input"
            />
          </div>
          <div>
            <label className="label">ราคา/คืน (บาท)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input"
              placeholder="2500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={applyRange}
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกราคา"}
            </button>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-slate-500 self-center">ช่วงด่วน:</span>
          <button
            type="button"
            onClick={() => quickSet(7)}
            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            7 วัน
          </button>
          <button
            type="button"
            onClick={() => quickSet(30)}
            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            30 วัน
          </button>
          <button
            type="button"
            onClick={() => quickSet(90)}
            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            90 วัน
          </button>
          <button
            type="button"
            onClick={() => quickSet(365)}
            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            1 ปี
          </button>
          <button
            type="button"
            onClick={() => {
              setRangeStart(format(monthStart, "yyyy-MM-dd"));
              setRangeEnd(format(monthEnd, "yyyy-MM-dd"));
            }}
            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            ทั้งเดือน
          </button>
        </div>

        {saveMsg && (
          <div
            className={
              "mt-3 px-3 py-2 rounded-md text-sm border " +
              (saveMsg.kind === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200")
            }
          >
            {saveMsg.text}
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg">{format(month, "MMMM yyyy")}</h3>
          {loading && (
            <span className="text-xs text-slate-500">กำลังโหลด...</span>
          )}
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs text-center text-slate-500 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const p = map.get(key);
            const isToday =
              format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            const weekend = [0, 6].includes(d.getDay());
            return (
              <div
                key={key}
                className={
                  "p-2 rounded border text-xs min-h-[60px] " +
                  (p !== undefined
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-200 text-slate-400") +
                  (isToday ? " ring-2 ring-gold-500" : "") +
                  (weekend ? " " : "")
                }
              >
                <div
                  className={
                    "font-medium " + (weekend ? "text-rose-600" : "text-slate-700")
                  }
                >
                  {format(d, "d")}
                </div>
                <div className="mt-0.5">
                  {p !== undefined ? (
                    <span className="text-emerald-700 font-semibold">
                      ฿{Number(p).toLocaleString()}
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 mt-3">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
            ตั้งราคาแล้ว
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />
            ยังไม่ได้ตั้ง — แขกจะจองวันนี้ไม่ได้
          </div>
        </div>
      </div>
    </div>
  );
}
