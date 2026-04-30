import { api } from "@/lib/api";
import { getSiteSettings } from "@/lib/site";
import { formatDate, formatPrice, vatBreakdown } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import { t as tr } from "@/lib/i18n";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function ConfirmationPage({ params }: Props) {
  const site = await getSiteSettings();
  const locale = getLocale();
  const t = (k: any) => tr(locale, k);

  let booking: any = null;
  try {
    booking = await api(`/api/bookings/${params.id}`);
  } catch (e) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-ivory">
        <div className="card p-12 max-w-md text-center">
          <h1 className="font-serif text-2xl mb-2">Not found</h1>
          <Link
            href="/"
            className="text-brand-700 hover:underline mt-4 inline-block"
          >
            {t("nav.backHome")}
          </Link>
        </div>
      </main>
    );
  }

  const isPaid = booking.paymentStatus === "PAID";
  return (
    <main className="min-h-screen bg-ivory">
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg">
            {site.hotelName.toUpperCase()}
            <span className="ml-1 text-[10px] tracking-[0.3em] text-gold-700">
              {site.brandTagline}
            </span>
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-brand-700">
            {t("nav.backHome")}
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {isPaid && (
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mb-4">
              ✓
            </div>
            <span className="eyebrow text-emerald-700">
              {t("conf.bookingConfirmed")}
            </span>
            <h1 className="font-serif text-4xl mt-2">{t("conf.success")}</h1>
            <p className="text-slate-600 mt-3">{t("conf.successHint")}</p>
          </div>
        )}

        {!isPaid && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mb-4">
              ⏳
            </div>
            <h1 className="font-serif text-3xl mt-2">{t("conf.yourBooking")}</h1>
            <p className="text-slate-600 mt-2 text-sm">{t("conf.notPaidHint")}</p>
          </div>
        )}

        <div className="card overflow-hidden">
          {booking.roomType?.imageUrls?.[0] && (
            <div className="aspect-[16/7] bg-slate-100 overflow-hidden">
              <img
                src={booking.roomType.imageUrls[0]}
                alt={booking.roomType.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-8">
            <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
              <div>
                <span className="text-xs text-slate-500 tracking-wider uppercase num">
                  {t("conf.bookingId")} #{booking.id.slice(0, 8)}
                </span>
                <h2 className="font-serif text-2xl mt-1">
                  {booking.roomType?.name ?? "-"}
                </h2>
              </div>
              <StatusPair
                status={booking.status}
                paymentStatus={booking.paymentStatus}
                t={t}
              />
            </div>

            <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-200">
              <div>
                <div className="text-xs text-slate-500 tracking-[0.1em] uppercase font-semibold">
                  {t("booking.checkIn")}
                </div>
                <FormattedDate value={booking.checkIn} />
                <div className="text-xs text-slate-500 mt-1 num tracking-wide">
                  {site.checkInTime}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 tracking-[0.1em] uppercase font-semibold">
                  {t("booking.checkOut")}
                </div>
                <FormattedDate value={booking.checkOut} />
                <div className="text-xs text-slate-500 mt-1 num tracking-wide">
                  {site.checkOutTime}
                </div>
              </div>
            </div>

            {booking.roomNumber && (
              <div className="mt-6 p-4 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-brand-700 font-semibold">
                    เลขห้องของคุณ · Your Room
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    แสดงที่เคาน์เตอร์เพื่อรับกุญแจ
                  </div>
                </div>
                <div className="num text-3xl font-bold text-brand-800">
                  {booking.roomNumber}
                </div>
              </div>
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 py-6 text-sm">
              <Item label={t("common.name")} value={booking.guestName} />
              <Item label={t("common.email")} value={booking.guestEmail} />
              <Item label={t("common.phone")} value={<span className="num">{booking.guestPhone}</span>} />
            </dl>

            {/* Price breakdown with VAT */}
            <PriceBreakdown
              total={Number(booking.totalPrice)}
              vatPercent={Number(site.vatPercent ?? 0)}
              vatLabel={site.vatLabel ?? "VAT"}
              t={t}
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/account" className="btn-secondary flex-1">
                {t("conf.bookHistory")}
              </Link>
              <Link href="/book" className="btn-primary flex-1">
                {t("conf.bookAgain")}
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          {t("conf.contactQuestion")}{" "}
          <span className="num">{site.contactPhone}</span> ·{" "}
          {site.contactEmail}
        </p>
      </div>
    </main>
  );
}

/**
 * Renders a date with a polished, hotel-ticket layout:
 *  - Big day number (tabular Inter for crispness)
 *  - Month name in serif italic (Cormorant)
 *  - Year in muted small caps
 */
function FormattedDate({ value }: { value: string | Date }) {
  const date = typeof value === "string" ? new Date(value) : value;
  const day = date.toLocaleString("en-GB", { day: "2-digit" });
  const month = date.toLocaleString("en-GB", { month: "long" });
  const year = date.toLocaleString("en-GB", { year: "numeric" });
  const weekday = date.toLocaleString("en-GB", { weekday: "short" });
  return (
    <div className="mt-2 flex items-baseline gap-2">
      <span className="price text-4xl text-slate-900 leading-none">{day}</span>
      <div className="leading-tight">
        <div className="font-serif italic text-lg text-slate-700">{month}</div>
        <div className="text-[10px] tracking-[0.18em] uppercase text-slate-400 num">
          {weekday} · {year}
        </div>
      </div>
    </div>
  );
}

function PriceBreakdown({
  total,
  vatPercent,
  vatLabel,
  t,
}: {
  total: number;
  vatPercent: number;
  vatLabel: string;
  t: (k: any) => string;
}) {
  const b = vatBreakdown(total, vatPercent);
  return (
    <div className="bg-slate-50 rounded-lg p-4 mt-2">
      {b.vatPercent > 0 && (
        <>
          <div className="flex justify-between text-sm text-slate-600 py-1">
            <span>Subtotal</span>
            <span className="price">{formatPrice(b.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 py-1">
            <span className="num">
              {vatLabel} ({b.vatPercent}%)
            </span>
            <span className="price">{formatPrice(b.vat)}</span>
          </div>
          <div className="border-t border-slate-200 my-1" />
        </>
      )}
      <div className="flex justify-between items-baseline pt-2">
        <span className="text-sm font-semibold uppercase tracking-wider text-slate-700">
          {t("booking.totalLabel")}
        </span>
        <span className="price text-2xl text-brand-800">
          {formatPrice(b.total)}
        </span>
      </div>
      {b.vatPercent > 0 && (
        <div className="text-[10px] text-slate-400 text-right mt-1">
          ราคารวม {vatLabel} แล้ว · Total includes {vatLabel}
        </div>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500 tracking-wider uppercase">
        {label}
      </dt>
      <dd className="text-slate-900 mt-1">{value}</dd>
    </div>
  );
}

function StatusPair({
  status,
  paymentStatus,
  t,
}: {
  status: string;
  paymentStatus: string;
  t: (k: any) => string;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {status === "CONFIRMED" && (
        <span className="badge-success">{t("status.confirmed")}</span>
      )}
      {status === "PENDING" && (
        <span className="badge-warning">{t("status.pending")}</span>
      )}
      {status === "CANCELLED" && (
        <span className="badge-danger">{t("status.cancelled")}</span>
      )}
      {paymentStatus === "PAID" ? (
        <span className="badge-success">{t("status.paid")}</span>
      ) : paymentStatus === "AWAITING_VERIFICATION" ? (
        <span className="badge bg-purple-50 text-purple-700 ring-1 ring-purple-600/20">
          {t("status.awaitingVerification")}
        </span>
      ) : (
        <span className="badge-neutral">{t("status.unpaid")}</span>
      )}
    </div>
  );
}
