"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Locale, TranslationKey } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<Ctx>({
  locale: "th",
  setLocale: () => {},
  t: (k) => t("th", k),
});

export default function LocaleProvider({
  initial,
  children,
}: {
  initial: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initial);
  const router = useRouter();

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      // Persist for 1 year
      document.cookie = `locale=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      // Refresh server components so they pick up the new locale
      router.refresh();
    },
    [router],
  );

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t: (k) => t(locale, k) }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
