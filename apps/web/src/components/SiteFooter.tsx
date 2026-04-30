import Link from "next/link";
import { getSiteSettings } from "@/lib/site";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function SiteFooter() {
  const site = await getSiteSettings();
  const locale = getLocale();
  return (
    <footer className="bg-slate-900 text-slate-300 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="font-serif text-2xl text-white">
            {site.hotelName.toUpperCase()}
            <span className="ml-1 text-[11px] tracking-[0.3em] text-gold-400">
              {site.brandTagline}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-400 max-w-sm leading-relaxed">
            {site.footerTagline}
          </p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3 text-sm">
            {t(locale, "footer.menu")}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                {t(locale, "nav.home")}
              </Link>
            </li>
            <li>
              <Link
                href="/book"
                className="hover:text-white transition-colors"
              >
                {t(locale, "nav.book")}
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                className="hover:text-white transition-colors"
              >
                {t(locale, "nav.account")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3 text-sm">
            {t(locale, "footer.contact")}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>{site.contactAddress}</li>
            <li className="num">
              {t(locale, "footer.tel")} {site.contactPhone}
            </li>
            <li>{site.contactEmail}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between text-xs text-slate-500">
          <span>
            © {new Date().getFullYear()} {site.hotelName}.{" "}
            {t(locale, "footer.allRights")}
          </span>
          <span>{t(locale, "footer.directBooking")}</span>
        </div>
      </div>
    </footer>
  );
}
