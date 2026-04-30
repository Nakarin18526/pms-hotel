"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

const SIDE_IMG =
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1400&q=85";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/account";
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("guest-credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError(t("auth.invalidCredentials"));
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative">
        <img src={SIDE_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 to-slate-900/30" />
        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <Link href="/" className="font-serif text-2xl">
            HOTEL
          </Link>
          <div>
            <p className="font-serif text-3xl leading-snug max-w-sm italic">
              "An experience above and beyond"
            </p>
            <p className="mt-3 text-sm text-white/70">— Travel Review 2024</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12 bg-ivory">
        <div className="w-full max-w-md animate-slide-up">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-brand-700 inline-flex items-center mb-6"
          >
            {t("nav.backHome")}
          </Link>
          <span className="eyebrow">{t("auth.welcomeBack")}</span>
          <h1 className="font-serif text-4xl mt-2 mb-8">{t("auth.signIn")}</h1>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="label">{t("common.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">{t("common.password")}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" />
            <span>{t("common.or")}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="btn-secondary w-full inline-flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            {t("common.signInWithGoogle")}
          </button>

          <p className="text-sm text-center text-slate-600 mt-8">
            {t("auth.noAccount")}{" "}
            <Link
              href="/register"
              className="text-brand-700 hover:text-brand-900 font-medium underline underline-offset-2"
            >
              {t("auth.signUp")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.232c1.89-1.74 2.981-4.305 2.981-7.351z"/>
      <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.619-2.422l-3.232-2.51c-.895.6-2.04.955-3.387.955-2.605 0-4.81-1.76-5.595-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z"/>
      <path fill="#FBBC05" d="M6.405 13.9a6.005 6.005 0 0 1 0-3.8V7.51H3.064a9.997 9.997 0 0 0 0 8.98l3.341-2.59z"/>
      <path fill="#EA4335" d="M12 5.977c1.468 0 2.786.505 3.823 1.495l2.866-2.866C16.96 2.992 14.696 2 12 2 8.09 2 4.713 4.243 3.064 7.51l3.341 2.59C7.19 7.737 9.395 5.977 12 5.977z"/>
    </svg>
  );
}
