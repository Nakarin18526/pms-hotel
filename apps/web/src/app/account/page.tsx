import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import { t as tr } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");
  const apiToken = (session as any).apiToken as string | undefined;
  if (!apiToken) redirect("/login");

  const locale = getLocale();
  const t = (k: any) => tr(locale, k);
  const site = await getSiteSettings();

  let bookings: any[] = [];
  try {
    bookings = await api("/api/bookings/guest/me", { token: apiToken });
  } catch {
    bookings = [];
  }

  // Active = not cancelled AND check-out is still in the future.
  // Includes CONFIRMED (paid) and PENDING with slip uploaded (processing).
  const isActive = (b: any) =>
    b.status !== "CANCELLED" && new Date(b.checkOut) >= new Date();
  const upcoming = bookings.filter(isActive);
  const past = bookings.filter((b) => !isActive(b));

  return (
    <main className="min-h-screen bg-ivory">
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg">
            {site.hotelName.toUpperCase()}
            <span className="ml-1 text-[10px] tracking-[0.3em] text-gold-700">
              {site.brandTagline}
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-slate-500 hover:text-brand-700">
              {t("nav.backHome")}
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="text-slate-500 hover:text-brand-700">
                {t("nav.logout")}
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="eyebrow">My account</span>
            <h1 className="font-serif text-4xl mt-2">
              {t("account.greeting")}, {session.user.name ?? "Guest"}
            </h1>
          </div>
          <Link href="/book" className="btn-primary">
            {t("account.bookNew")}
          </Link>
        </div>

        {bookings.length === 0 && (
          <div className="card p-14 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-gold-50 text-gold-700 flex items-center justify-center text-xl mb-4">
              ♢
            </div>
            <h3 className="font-serif text-xl mb-2">
              {t("account.noBookings")}
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              {t("account.noBookingsHint")}
            </p>
            <Link href="/book" className="btn-primary">
              {t("nav.book")}
            </Link>
          </div>
        )}

        {upcoming.length > 0 && (
          <Section title={t("account.upcoming")} bookings={upcoming} locale={locale} t={t} />
        )}
        {past.length > 0 && (
          <Section
            title={t("account.history")}
            bookings={past}
            subtle
            locale={locale}
            t={t}
          />
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  bookings,
  subtle,
  locale,
  t,
}: {
  title: string;
  bookings: any[];
  subtle?: boolean;
  locale: string;
  t: (k: any) => string;
}) {
  return (
    <section className={subtle ? "mt-12" : ""}>
      <h2 className="font-serif text-2xl mb-4">{title}</h2>
      <div className="space-y-3">
        {bookings.map((b) => (
          <Link
            key={b.id}
            href={`/booking/${b.id}/confirmation`}
            className="card card-hover p-5 flex items-center justify-between gap-4 group"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                {b.roomType?.imageUrls?.[0] && (
                  <img
                    src={b.roomType.imageUrls[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="font-serif text-lg flex items-center gap-2">
                  {b.roomType?.name ?? "—"}
                  {b.roomNumber && (
                    <span className="num text-xs font-bold bg-brand-50 text-brand-800 px-2 py-0.5 rounded">
                      ห้อง {b.roomNumber}
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-600 mt-0.5 num">
                  {formatDate(b.checkIn, locale === "th" ? "en-GB" : "en-GB")} →{" "}
                  {formatDate(b.checkOut, locale === "th" ? "en-GB" : "en-GB")}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge
                    status={b.status}
                    paymentStatus={b.paymentStatus}
                    t={t}
                  />
                  <span className="text-xs text-slate-500 price">
                    {formatPrice(Number(b.totalPrice))}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-slate-400 group-hover:text-brand-700 transition-colors">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({
  status,
  paymentStatus,
  t,
}: {
  status: string;
  paymentStatus?: string;
  t: (k: any) => string;
}) {
  if (status === "CANCELLED")
    return <span className="badge-danger">{t("status.cancelled")}</span>;
  if (paymentStatus === "AWAITING_VERIFICATION")
    return (
      <span className="badge bg-purple-50 text-purple-700 ring-1 ring-purple-600/20">
        {t("status.awaitingVerification")}
      </span>
    );
  if (status === "CONFIRMED")
    return <span className="badge-success">{t("status.confirmed")}</span>;
  // PENDING (no slip yet)
  return (
    <span className="badge-warning">{t("status.awaitingPayment")}</span>
  );
}
