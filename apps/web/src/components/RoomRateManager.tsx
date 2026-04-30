"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

interface Props {
  roomTypeId: string;
  roomTypeName?: string;
}

type Mode = "single" | "range";

export default function RoomRateManager({ roomTypeId, roomTypeName }: Props) {
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [rates, setRates] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [savingDates, setSavingDates] = useState<Set<string>>(new Set());
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const [mode, setMode] = useState<Mode>("single");
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");

  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [rangePrice, setRangePrice] = useState<string>("");

  const [defaultPrice, setDefaultPrice] = useState<string>("");

  const [toast, setToast] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  // Show toast briefly
  function showToast(kind: "success" | "error", text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 3000);
  }

  const loadRates = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/api/room-types/${roomTypeId}/rates?startDate=${format(startOfMonth(month), "yyyy-MM-dd")}&endDate=${format(endOfMonth(month), "yyyy-MM-dd")}`,
      );
      if (!r.ok) throw new Error(await r.text());
      const data: { date: string; price: number }[] = await r.json();
      setRates(new Map(data.map((d) => [d.date, d.price])));
      setLastSync(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [roomTypeId, month]);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  // Auto-refresh: every 10s + on window focus
  useEffect(() => {
    const onFocus = () => loadRates();
    window.addEventListener("focus", onFocus);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") loadRates();
    }, 10000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [loadRates]);

  async function setOneDate(date: string, price: number) {
    if (!apiToken) {
      showToast("error", "ไม่ได้ login");
      return;
    }
    setSavingDates((s) => new Set(s).add(date));
    // Optimistic update
    setRates((m) => new Map(m).set(date, price));
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
            startDate: date,
            endDate: date,
            price,
          }),
        },
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message ?? (await r.text()));
      }
      showToast("success", `✓ ${date} → ฿${price.toLocaleString()}`);
    } catch (e: any) {
      showToast("error", e.message);
      // revert
      await loadRates();
    } finally {
      setSavingDates((s) => {
        const c = new Set(s);
        c.delete(date);
        return c;
      });
    }
  }

  async function setRange(
    startDate: string,
    endDate: string,
    price: number,
  ) {
    if (!apiToken) return;
    try {
      const r = await fetch(
        `${API}/api/admin/room-types/${roomTypeId}/rates`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({ startDate, endDate, price }),
        },
      );
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      showToast(
        "success",
        `✓ ตั้งราคา ฿${price.toLocaleString()} × ${data.updated} วัน`,
      );
      await loadRates();
    } catch (e: any) {
      showToast("error", e.message);
    }
  }

  async function fillEmptyDays(price: number, days: number) {
    if (!apiToken) return;
    const today = new Date();
    const promises: Promise<any>[] = [];
    let count = 0;
    for (let i = 0; i < days; i++) {
      const d = format(addDays(today, i), "yyyy-MM-dd");
      if (!rates.has(d)) {
        count++;
        promises.push(
          fetch(`${API}/api/admin/room-types/${roomTypeId}/rates`, {
            method: "PUT",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${apiToken}`,
            },
            body: JSON.stringify({ startDate: d, endDate: d, price }),
          }),
        );
      }
    }
    if (count === 0) {
      showToast("error", "ไม่มีวันที่ว่างใน " + days + " วันข้างหน้า");
      return;
    }
    await Promise.all(promises);
    showToast(
      "success",
      `✓ เติมราคา ฿${price.toLocaleString()} × ${count} วันที่ว่าง`,
    );
    await loadRates();
  }

  function handleCellClick(date: string) {
    if (mode === "single") {
      setOpenDate(date);
      setEditPrice(rates.get(date)?.toString() ?? defaultPrice ?? "");
    } else {
      // range mode
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(date);
        setRangeEnd(null);
      } else {
        if (date < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(date);
        } else {
          setRangeEnd(date);
        }
      }
    }
  }

  function applyRange() {
    if (!rangeStart || !rangeEnd) return;
    const p = Number(rangePrice);
    if (!p || p <= 0) {
      showToast("error", "กรุณากรอกราคา > 0");
      return;
    }
    setRange(rangeStart, rangeEnd, p);
    setRangeStart(null);
    setRangeEnd(null);
    setRangePrice("");
  }

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days: Date[] = [];
  for (let d = monthStart; d <= monthEnd; d = addDays(d, 1)) days.push(new Date(d));
  const setCount = Array.from(rates.keys()).length;

  return (
    <div className="space-y-4 relative">
      {/* Top toolbar */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-500">
              โหมด:
            </span>
            <button
              type="button"
              onClick={() => {
                setMode("single");
                setRangeStart(null);
                setRangeEnd(null);
              }}
              className={
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors " +
                (mode === "single"
                  ? "bg-brand-700 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100")
              }
            >
              คลิกแก้ทีละวัน
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("range");
                setOpenDate(null);
              }}
              className={
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors " +
                (mode === "range"
                  ? "bg-brand-700 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100")
              }
            >
              เลือกช่วงวัน
            </button>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            {loading && <span>กำลังซิงค์...</span>}
            {lastSync && !loading && (
              <span>↻ {lastSync.toLocaleTimeString("th-TH")}</span>
            )}
            <button
              type="button"
              onClick={loadRates}
              className="px-2 py-1 rounded hover:bg-slate-200 text-slate-700"
              title="รีเฟรช"
            >
              ↻
            </button>
          </div>
        </div>

        {mode === "single" && (
          <p className="text-xs text-slate-600 mt-3">
            👆 คลิกที่วันใดก็ได้บนปฏิทินเพื่อตั้ง/แก้ราคาวันนั้นทันที
          </p>
        )}

        {mode === "range" && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-slate-600">
              👆 คลิกวันเริ่ม → คลิกวันสิ้นสุด → กรอกราคา → กดบันทึก
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="label">วันเริ่ม</label>
                <input
                  type="date"
                  value={rangeStart ?? ""}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">วันสิ้นสุด</label>
                <input
                  type="date"
                  value={rangeEnd ?? ""}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  min={rangeStart ?? undefined}
                  className="input"
                />
              </div>
              <div>
                <label className="label">ราคา/คืน</label>
                <input
                  type="number"
                  min={0}
                  value={rangePrice}
                  onChange={(e) => setRangePrice(e.target.value)}
                  className="input"
                  placeholder="2500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={applyRange}
                  disabled={!rangeStart || !rangeEnd || !rangePrice}
                  className="btn-primary w-full"
                >
                  บันทึก
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs items-center">
              <span className="text-slate-500">ช่วงด่วน:</span>
              {[
                { label: "7 วัน", days: 7 },
                { label: "30 วัน", days: 30 },
                { label: "90 วัน", days: 90 },
                { label: "1 ปี", days: 365 },
              ].map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => {
                    const today = format(new Date(), "yyyy-MM-dd");
                    setRangeStart(today);
                    setRangeEnd(format(addDays(new Date(), p.days - 1), "yyyy-MM-dd"));
                  }}
                  className="px-3 py-1 rounded-full bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-500 self-center">เติมเติม:</span>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={defaultPrice}
              onChange={(e) => setDefaultPrice(e.target.value)}
              className="input py-1 w-28 text-sm"
              placeholder="2500"
            />
            <button
              type="button"
              onClick={() => {
                const p = Number(defaultPrice);
                if (!p) {
                  showToast("error", "กรอกราคาก่อน");
                  return;
                }
                fillEmptyDays(p, 365);
              }}
              disabled={!defaultPrice}
              className="px-3 py-1.5 rounded-md text-xs bg-gold-600 text-white hover:bg-gold-700 disabled:opacity-50"
            >
              เติมราคานี้ให้วันที่ยังไม่มี (1 ปี)
            </button>
          </div>
        </div>
      </div>

      {/* Calendar header — month nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            ←
          </button>
          <input
            type="month"
            value={format(month, "yyyy-MM")}
            onChange={(e) => setMonth(startOfMonth(parseISO(e.target.value + "-01")))}
            className="input w-44 py-1.5"
          />
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            →
          </button>
        </div>
        <div className="text-xs text-slate-500">
          ตั้งแล้ว {setCount}/{days.length} วัน
        </div>
      </div>

      {/* Calendar grid */}
      <div>
        <div className="grid grid-cols-7 gap-1 text-[11px] text-center text-slate-500 mb-1">
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
            const p = rates.get(key);
            const isToday =
              format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            const weekend = [0, 6].includes(d.getDay());
            const saving = savingDates.has(key);
            const inRange =
              mode === "range" &&
              rangeStart &&
              rangeEnd &&
              key >= rangeStart &&
              key <= rangeEnd;
            const isRangeStart = mode === "range" && rangeStart === key;
            const isRangeEndStart = mode === "range" && rangeEnd === key;
            const isOpen = openDate === key;

            return (
              <div key={key} className="relative">
                <button
                  type="button"
                  onClick={() => handleCellClick(key)}
                  disabled={saving}
                  className={
                    "w-full p-2 rounded border text-xs min-h-[60px] cursor-pointer transition-all text-left " +
                    (p !== undefined
                      ? "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400"
                      : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-400") +
                    (isToday ? " ring-2 ring-gold-500" : "") +
                    (inRange ? " bg-brand-100 border-brand-400" : "") +
                    (isRangeStart || isRangeEndStart
                      ? " ring-2 ring-brand-600"
                      : "") +
                    (saving ? " opacity-60" : "")
                  }
                >
                  <div
                    className={
                      "font-medium " +
                      (weekend ? "text-rose-600" : "text-slate-700")
                    }
                  >
                    {format(d, "d")}
                  </div>
                  <div className="mt-0.5">
                    {p !== undefined ? (
                      <span className="text-emerald-700 price">
                        ฿{Number(p).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400">+ ตั้งราคา</span>
                    )}
                  </div>
                  {saving && (
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      กำลังบันทึก...
                    </div>
                  )}
                </button>

                {/* Inline editor popover */}
                {isOpen && (
                  <div
                    className="absolute z-30 top-full mt-1 left-0 right-0 sm:left-auto sm:w-56 bg-white rounded-lg shadow-lift border border-slate-300 p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs text-slate-500 mb-2">
                      {format(d, "EEE, dd MMM yyyy")}
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        autoFocus
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const v = Number(editPrice);
                            if (v > 0) {
                              setOneDate(key, v);
                              setOpenDate(null);
                            }
                          }
                          if (e.key === "Escape") setOpenDate(null);
                        }}
                        className="input py-1 text-sm flex-1"
                        placeholder="ราคา"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const v = Number(editPrice);
                          if (v > 0) {
                            setOneDate(key, v);
                            setOpenDate(null);
                          }
                        }}
                        className="px-3 py-1 bg-brand-700 text-white rounded text-sm hover:bg-brand-800"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenDate(null)}
                        className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200"
                      >
                        ✕
                      </button>
                    </div>
                    {p !== undefined && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("ลบราคาวันนี้?")) {
                            // Setting to 0 isn't allowed by backend (>=0).
                            // We delete by setting price to 0 — but our backend
                            // allows price=0. We don't have a delete endpoint, so
                            // this would zero the price. To "remove", admin can
                            // simply leave it. Here we just close.
                            setOpenDate(null);
                          }
                        }}
                        className="mt-2 text-xs text-red-600 hover:underline"
                      >
                        (จะลบราคาทำได้จากฐานข้อมูลโดยตรง)
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-3">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
            มีราคา (คลิกเพื่อแก้)
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />
            ยังไม่ตั้ง (คลิกเพื่อตั้ง)
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded ring-2 ring-gold-500 inline-block" />
            วันนี้
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={
            "fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg shadow-lift border text-sm animate-fade-in " +
            (toast.kind === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200")
          }
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
