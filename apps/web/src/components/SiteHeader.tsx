import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getSiteSettings } from "@/lib/site";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

export default async function SiteHeader({
  transparent = false,
}: {
  transparent?: boolean;
}) {
  const session = await auth();
  const isGuest = !!session?.user;
  const site = await getSiteSettings();
  const locale = getLocale();

  return (
    <header
      className={
        "absolute top-0 inset-x-0 z-30 " +
        (transparent
          ? "bg-transparent"
          : "bg-white/80 backdrop-blur-md border-b border-slate-200/60 relative")
      }
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className={
            "font-serif text-xl tracking-wide " +
            (transparent ? "text-white" : "text-slate-900")
          }
        >
          {site.hotelName.toUpperCase()}
          <span
            className={
              "ml-1 text-[10px] tracking-[0.3em] " +
              (transparent ? "text-white/70" : "text-gold-700")
            }
          >
            {site.brandTagline}
          </span>
        </Link>

        <nav
          className={
            "flex items-center gap-1 text-sm " +
            (transparent ? "text-white/90" : "text-slate-700")
          }
        >
          <Link
            href="/book"
            className={
              "px-3 py-2 rounded-md transition-colors " +
              (transparent ? "hover:bg-white/10" : "hover:bg-slate-100")
            }
          >
            {t(locale, "nav.book")}
          </Link>
          {isGuest ? (
            <>
              <Link
                href="/account"
                className={
                  "px-3 py-2 rounded-md transition-colors " +
                  (transparent ? "hover:bg-white/10" : "hover:bg-slate-100")
                }
              >
                {t(locale, "nav.account")}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  className={
                    "px-3 py-2 rounded-md transition-colors " +
                    (transparent ? "hover:bg-white/10" : "hover:bg-slate-100")
                  }
                >
                  {t(locale, "nav.logout")}
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className={
                "ml-1 " +
                (transparent
                  ? "px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 backdrop-blur"
                  : "btn-secondary")
              }
            >
              {t(locale, "nav.login")}
            </Link>
          )}
          <div className="ml-1">
            <LanguageSwitcher transparent={transparent} />
          </div>
        </nav>
      </div>
    </header>
  );
}
