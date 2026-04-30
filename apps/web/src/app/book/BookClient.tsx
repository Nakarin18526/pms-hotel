"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { addDays, format, differenceInCalendarDays } from "date-fns";
import { api } from "@/lib/api";
import { formatPrice, vatBreakdown } from "@/lib/format";
import { useLocale } from "@/components/LocaleProvider";
import type { AvailabilityRoomTypeResult } from "@pms/types";
import type { TranslationKey } from "@/lib/i18n";

type Step = "dates" | "rooms" | "guest" | "submitting";

interface BookClientProps {
  hotelName?: string;
  brandTagline?: string;
  cancellationPolicy?: string;
  vatPercent?: number;
  vatLabel?: string;
}

export default function BookClient({
  hotelName = "Aurelia",
  brandTagline = "HOTEL",
  cancellationPolicy = "การจองทุกรายการ ไม่สามารถขอคืนเงินได้ในทุกกรณี (All sales final)",
  vatPercent = 0,
  vatLabel = "VAT",
}: BookClientProps) {
  const { data: session } = useSession();
  const { t } = useLocale();
  const today = useMemo(() => new Date(), []);
  const [checkIn, setCheckIn] = useState(format(addDays(today, 1), "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState(
    format(addDays(today, 3), "yyyy-MM-dd"),
  );
  const [step, setStep] = useState<Step>("dates");
  const [results, setResults] = useState<AvailabilityRoomTypeResult[]>([]);
  const [selected, setSelected] = useState<AvailabilityRoomTypeResult | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState((session?.user as any)?.name ?? "");
  const [email, setEmail] = useState((session?.user as any)?.email ?? "");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "PROMPTPAY">(
    "PROMPTPAY",
  );

  useEffect(() => {
    if (session?.user) {
      setName((session.user as any).name ?? "");
      setEmail((session.user as any).email ?? "");
    }
  }, [session]);

  const nights = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const searchRooms = useCallback(
    async (advance: boolean = true) => {
      setError(null);
      const ns = differenceInCalendarDays(
        new Date(checkOut),
        new Date(checkIn),
      );
      if (ns < 1) {
        setError("วันเช็คเอาต์ต้องมากกว่าวันเช็คอินอย่างน้อย 1 วัน");
        return;
      }
      setLoading(true);
      try {
        const data = await api<AvailabilityRoomTypeResult[]>(
          `/api/availability?checkIn=${checkIn}&checkOut=${checkOut}`,
        );
        setResults(data);
        setLastRefresh(new Date());
        if (advance) setStep("rooms");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [checkIn, checkOut],
  );

  // Real-time: re-fetch availability when guest is on the rooms step
  // - on window focus (switching back to tab)
  // - every 15 seconds while visible
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    if (step !== "rooms") return;
    const onFocus = () => searchRooms(false);
    window.addEventListener("focus", onFocus);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") searchRooms(false);
    }, 15000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [step, searchRooms]);

  function selectRoom(r: AvailabilityRoomTypeResult) {
    if (!r.available) return;
    setSelected(r);
    setStep("guest");
  }

  async function submitBooking() {
    if (!selected) return;
    setError(null);
    setStep("submitting");
    try {
      const apiToken = (session as any)?.apiToken;
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/bookings`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(apiToken ? { authorization: `Bearer ${apiToken}` } : {}),
          },
          body: JSON.stringify({
            roomTypeId: selected.roomTypeId,
            checkIn,
            checkOut,
            guestName: name,
            guestPhone: phone,
            guestEmail: email,
            paymentMethod,
          }),
        },
      );
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t);
      }
      const data = await r.json();
      window.location.href = data.checkoutUrl;
    } catch (e: any) {
      setError(e.message);
      setStep("guest");
    }
  }

  return (
    <main className="min-h-screen bg-ivory">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg">
            {hotelName.toUpperCase()}
            <span className="ml-1 text-[10px] tracking-[0.3em] text-gold-700">
              {brandTagline}
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-brand-700"
          >
            {t("nav.backHome")}
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <span className="eyebrow">Reservation</span>
          <h1 className="font-serif text-4xl mt-2">{t("booking.title")}</h1>
          <p className="text-slate-600 mt-2 text-sm">{t("booking.subtitle")}</p>
        </div>

        <Steps current={step} t={t} />

        <div className="animate-fade-in">
          {step === "dates" && (
            <div className="card p-8 max-w-2xl mx-auto">
              <h2 className="font-serif text-2xl mb-6">
                {t("booking.step.dates")}
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label">{t("booking.checkIn")}</label>
                  <input
                    type="date"
                    className="input"
                    value={checkIn}
                    min={format(today, "yyyy-MM-dd")}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">{t("booking.checkOut")}</label>
                  <input
                    type="date"
                    className="input"
                    value={checkOut}
                    min={format(addDays(new Date(checkIn), 1), "yyyy-MM-dd")}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {t("booking.duration")} ·{" "}
                  <b className="text-slate-900 num">{nights}</b>{" "}
                  {t("booking.nights")}
                </span>
                {error && <span className="text-red-600">{error}</span>}
              </div>
              <button
                onClick={() => searchRooms(true)}
                disabled={loading}
                className="btn-primary mt-7 w-full"
              >
                {loading ? t("booking.searching") : t("booking.searchRooms")}
              </button>
            </div>
          )}

          {step === "rooms" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm flex-wrap gap-2">
                <span className="text-slate-700 num">
                  {checkIn} → {checkOut} ·{" "}
                  <b>{nights}</b> {t("booking.nights")}
                </span>
                <div className="flex items-center gap-3">
                  {lastRefresh && (
                    <span className="text-xs text-slate-400 num">
                      {t("booking.lastUpdated")}{" "}
                      {lastRefresh.toLocaleTimeString()}
                    </span>
                  )}
                  <button
                    onClick={() => searchRooms(false)}
                    disabled={loading}
                    className="text-brand-700 hover:text-brand-900 text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? "..." : `↻ ${t("common.refresh")}`}
                  </button>
                  <button
                    onClick={() => setStep("dates")}
                    className="text-brand-700 hover:text-brand-900 text-sm font-medium"
                  >
                    {t("booking.changeDates")}
                  </button>
                </div>
              </div>
              {results.length === 0 && (
                <div className="card p-10 text-center text-slate-500">
                  ไม่มีประเภทห้องในระบบ
                </div>
              )}
              {results.map((r) => (
                <RoomCard key={r.roomTypeId} room={r} onSelect={selectRoom} t={t} />
              ))}
            </div>
          )}

          {step === "guest" && selected && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 card p-8">
                <h2 className="font-serif text-2xl mb-1">
                  {t("booking.guestInfo")}
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  {t("booking.guestInfoNote")}
                </p>
                <div className="space-y-5">
                  <div>
                    <label className="label">{t("common.name")}</label>
                    <input
                      className="input"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">{t("common.email")}</label>
                      <input
                        type="email"
                        className="input"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">{t("common.phone")}</label>
                      <input
                        className="input num"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812345678"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-7">
                  <label className="label mb-2">{t("booking.paymentMethod")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("PROMPTPAY")}
                      className={
                        "p-4 rounded-lg border-2 text-left transition-all " +
                        (paymentMethod === "PROMPTPAY"
                          ? "border-brand-700 bg-brand-50"
                          : "border-slate-200 hover:border-slate-300")
                      }
                    >
                      <div className="text-2xl mb-1">🏦</div>
                      <div className="font-medium text-sm">
                        {t("booking.transferQR")}
                      </div>
                      <div className="text-xs text-slate-500">
                        {t("booking.transferQRHint")}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("STRIPE")}
                      className={
                        "p-4 rounded-lg border-2 text-left transition-all " +
                        (paymentMethod === "STRIPE"
                          ? "border-brand-700 bg-brand-50"
                          : "border-slate-200 hover:border-slate-300")
                      }
                    >
                      <div className="text-2xl mb-1">💳</div>
                      <div className="font-medium text-sm">
                        {t("booking.creditCard")}
                      </div>
                      <div className="text-xs text-slate-500">
                        {t("booking.creditCardHint")}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mt-5 bg-amber-50 border border-amber-200/80 rounded-lg p-4 text-sm text-amber-900 flex gap-3">
                  <span className="text-base">⚠</span>
                  <div>
                    <b>{t("booking.policy")}</b>
                    <p className="mt-0.5 text-amber-800">
                      {cancellationPolicy}
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-4">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 mt-7">
                  <button
                    onClick={() => setStep("rooms")}
                    className="btn-secondary"
                    type="button"
                  >
                    {t("booking.chooseAnother")}
                  </button>
                  <button
                    onClick={submitBooking}
                    disabled={!name || !email || !phone}
                    className="btn-gold flex-1"
                  >
                    {t("booking.proceed")}
                  </button>
                </div>
              </div>

              {/* Summary sidebar */}
              <aside className="card p-6 h-fit md:sticky md:top-6">
                <h3 className="font-serif text-lg">{t("booking.summary")}</h3>
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 mt-4">
                  {selected.imageUrls?.[0] && (
                    <img
                      src={selected.imageUrls[0]}
                      alt={selected.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="mt-4">
                  <div className="font-medium">{selected.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {t("booking.maxGuests")} {selected.maxOccupancy}{" "}
                    {t("booking.guests")}
                  </div>
                </div>

                <div className="divider" />

                <div className="text-sm space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>{t("booking.checkIn")}</span>
                    <span className="num">{checkIn}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t("booking.checkOut")}</span>
                    <span className="num">{checkOut}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t("booking.nights")}</span>
                    <span className="num">
                      {selected.nights} {t("booking.nights")}
                    </span>
                  </div>
                </div>

                <div className="divider" />

                <details className="text-xs">
                  <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                    {t("booking.priceBreakdown")}
                  </summary>
                  <div className="mt-2 space-y-1">
                    {selected.pricePerNight.map((n) => (
                      <div key={n.date} className="flex justify-between">
                        <span className="text-slate-500 num">{n.date}</span>
                        <span className="price">{formatPrice(n.price)}</span>
                      </div>
                    ))}
                  </div>
                </details>

                {/* VAT breakdown */}
                {(() => {
                  const b = vatBreakdown(selected.totalPrice, vatPercent);
                  return (
                    <>
                      {b.vatPercent > 0 && (
                        <div className="text-xs space-y-1 mt-3 pt-3 border-t border-slate-200">
                          <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span className="price">
                              {formatPrice(b.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span className="num">
                              {vatLabel} ({b.vatPercent}%)
                            </span>
                            <span className="price">{formatPrice(b.vat)}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between font-serif text-xl mt-3 pt-3 border-t border-slate-200">
                        <span>{t("booking.totalLabel")}</span>
                        <span className="price text-2xl">
                          {formatPrice(b.total)}
                        </span>
                      </div>
                      {b.vatPercent > 0 && (
                        <div className="text-[10px] text-slate-400 text-right mt-0.5">
                          ราคารวม {vatLabel} แล้ว
                        </div>
                      )}
                    </>
                  );
                })()}
              </aside>
            </div>
          )}

          {step === "submitting" && (
            <div className="card p-12 text-center max-w-md mx-auto">
              <div className="w-12 h-12 border-2 border-brand-200 border-t-brand-700 rounded-full mx-auto animate-spin" />
              <p className="mt-5 text-slate-600">{t("booking.preparing")}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Steps({
  current,
  t,
}: {
  current: Step;
  t: (k: TranslationKey) => string;
}) {
  const steps: { key: Step; label: string }[] = [
    { key: "dates", label: t("booking.step.dates") },
    { key: "rooms", label: t("booking.step.rooms") },
    { key: "guest", label: t("booking.step.guest") },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <ol className="flex items-center justify-center gap-2 mb-10 text-sm">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className={
              "w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs transition-colors " +
              (i < idx
                ? "bg-brand-700 text-white"
                : i === idx
                  ? "bg-gold-600 text-white ring-4 ring-gold-200"
                  : "bg-slate-200 text-slate-500")
            }
          >
            {i + 1}
          </span>
          <span
            className={
              "text-xs uppercase tracking-wider " +
              (i === idx
                ? "text-slate-900 font-medium"
                : "text-slate-400")
            }
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className="text-slate-300 mx-2">———</span>
          )}
        </li>
      ))}
    </ol>
  );
}

function RoomCard({
  room,
  onSelect,
  t,
}: {
  room: AvailabilityRoomTypeResult;
  onSelect: (r: AvailabilityRoomTypeResult) => void;
  t: (k: TranslationKey) => string;
}) {
  return (
    <article
      className={
        "card overflow-hidden flex flex-col md:flex-row " +
        (!room.available ? "opacity-60" : "card-hover")
      }
    >
      <div className="md:w-72 aspect-[4/3] md:aspect-auto bg-slate-100 overflow-hidden flex-shrink-0">
        {room.imageUrls?.[0] ? (
          <img
            src={room.imageUrls[0]}
            alt={room.name}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-serif text-2xl">{room.name}</h3>
            <p className="text-sm text-slate-600 mt-1.5 line-clamp-2">
              {room.description}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
              <span>
                👤 {t("booking.maxGuests")}{" "}
                <span className="num">{room.maxOccupancy}</span>{" "}
                {t("booking.guests")}
              </span>
              <span>·</span>
              <span className="num">
                {t("booking.unitsLeft")} {room.availableUnits}/
                {room.totalUnits} {t("booking.rooms")}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {room.totalPrice > 0 ? (
              <>
                <div className="price text-2xl text-slate-900">
                  {formatPrice(room.totalPrice)}
                </div>
                <div className="text-xs text-slate-500">
                  {t("booking.totalNights")}{" "}
                  <span className="num">{room.nights}</span>{" "}
                  {t("booking.nights")}
                </div>
              </>
            ) : (
              <span className="text-sm text-slate-500">—</span>
            )}
          </div>
        </div>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div>
            {room.available ? (
              <span className="badge-success">{t("booking.available")}</span>
            ) : (
              <span className="badge-neutral">
                {room.unavailableReason === "FULLY_BOOKED"
                  ? t("booking.fullyBooked")
                  : t("booking.noPriceRange")}
              </span>
            )}
          </div>
          {room.available && (
            <button onClick={() => onSelect(room)} className="btn-primary">
              {t("booking.selectRoom")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
