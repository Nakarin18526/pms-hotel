import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { api } from "@/lib/api";
import { getSiteSettings } from "@/lib/site";
import { getLocale } from "@/lib/locale";
import { t as tr } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [rooms, site] = await Promise.all([
    api<any[]>("/api/room-types").catch(() => []),
    getSiteSettings(),
  ]);
  const locale = getLocale();
  const t = (k: any) => tr(locale, k);

  return (
    <>
      {/* HERO */}
      <section className="relative h-[88vh] min-h-[560px] w-full overflow-hidden">
        <img
          src={site.heroImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/30 to-slate-900/80" />
        <SiteHeader transparent />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 text-white">
          <span className="text-xs tracking-[0.4em] text-gold-300 mb-4">
            {site.heroEyebrow}
          </span>
          <h1 className="font-serif text-5xl md:text-7xl font-medium leading-tight max-w-3xl">
            {site.heroTitle}
            <br />
            <span className="italic text-gold-200">{site.heroTitleAccent}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base md:text-lg text-white/85 leading-relaxed">
            {site.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/book" className="btn-gold btn-lg">
              {t("nav.book")}
            </Link>
            <a
              href="#rooms"
              className="btn-lg inline-flex items-center justify-center rounded-md px-8 py-3 text-base font-medium text-white border border-white/40 backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              {t("home.accommodationsTitle")}
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="eyebrow">{t("home.whyEyebrow")}</span>
          <h2 className="font-serif text-4xl mt-3">{t("home.whyTitle")}</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Feature
            icon="✦"
            title={site.feature1Title}
            desc={site.feature1Desc}
          />
          <Feature
            icon="◇"
            title={site.feature2Title}
            desc={site.feature2Desc}
          />
          <Feature
            icon="❖"
            title={site.feature3Title}
            desc={site.feature3Desc}
          />
        </div>
      </section>

      {/* FEATURED ROOMS */}
      <section id="rooms" className="bg-white py-20 border-y border-slate-200/70">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <span className="eyebrow">{t("home.accommodationsEyebrow")}</span>
              <h2 className="font-serif text-4xl mt-3">
                {t("home.accommodationsTitle")}
              </h2>
            </div>
            <Link
              href="/book"
              className="text-sm text-brand-700 hover:text-brand-900 underline underline-offset-4"
            >
              {t("home.checkAvailability")}
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {rooms.length === 0 && (
              <div className="md:col-span-2 text-center text-slate-500 py-10">
                {t("home.noRooms")}
              </div>
            )}
            {rooms.map((rt) => (
              <article
                key={rt.id}
                className="group rounded-2xl overflow-hidden bg-white shadow-soft card-hover"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                  {rt.imageUrls?.[0] ? (
                    <img
                      src={rt.imageUrls[0]}
                      alt={rt.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl">{rt.name}</h3>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                    {rt.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-slate-500 tracking-wider uppercase">
                      {t("booking.maxGuests")}{" "}
                      <span className="num">{rt.maxOccupancy}</span>{" "}
                      {t("booking.guests")} ·{" "}
                      <span className="num">{rt.totalUnits}</span>{" "}
                      {t("booking.rooms")}
                    </div>
                    <Link
                      href="/book"
                      className="text-sm text-brand-700 hover:text-brand-900 font-medium"
                    >
                      {t("home.bookCta")}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <span className="eyebrow">{t("home.makeReservationEyebrow")}</span>
        <h2 className="font-serif text-4xl mt-3 max-w-2xl mx-auto">
          {t("home.ctaTitle")}
        </h2>
        <p className="mt-4 text-slate-600 max-w-xl mx-auto">
          {t("home.ctaDesc")}
        </p>
        <Link href="/book" className="btn-primary btn-lg mt-7 inline-flex">
          {t("nav.book")}
        </Link>
      </section>

      <SiteFooter />

      <Link
        href="/admin/login"
        className="fixed bottom-3 right-3 text-[11px] text-slate-300 hover:text-slate-500 transition-colors z-50"
        aria-label="Staff portal"
      >
        Staff
      </Link>
    </>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 mx-auto rounded-full bg-gold-50 text-gold-700 flex items-center justify-center text-xl mb-5">
        {icon}
      </div>
      <h3 className="font-serif text-xl mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
