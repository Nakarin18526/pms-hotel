"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "./LocaleProvider";
import { LOCALES } from "@/lib/i18n";

export default function LanguageSwitcher({
  transparent = false,
}: {
  transparent?: boolean;
}) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "px-2.5 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors " +
          (transparent
            ? "text-white/90 hover:bg-white/10"
            : "text-slate-700 hover:bg-slate-100")
        }
        aria-label="Language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline text-xs uppercase tracking-wider">
          {current.code}
        </span>
        <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lift border border-slate-200 py-1 z-50 animate-fade-in">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
              className={
                "w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 " +
                (l.code === locale ? "text-brand-700 font-medium" : "text-slate-700")
              }
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span>{l.label}</span>
              {l.code === locale && (
                <span className="ml-auto text-brand-700">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
