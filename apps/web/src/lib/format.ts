export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "THB";

const priceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  useGrouping: true,
});

const priceWithDecimalsFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Currency-formatted price like "2,500 THB" — uses lining figures. */
export function formatPrice(amount: number) {
  return `${priceFormatter.format(Math.round(amount))} ${CURRENCY}`;
}

/** With currency symbol prefix: "฿2,500" */
export function formatBaht(amount: number) {
  return `฿${priceFormatter.format(Math.round(amount))}`;
}

/** With 2 decimals — used for slip verification etc. */
export function formatPriceDecimals(amount: number) {
  return `${priceWithDecimalsFormatter.format(amount)} ${CURRENCY}`;
}

const dateFormatters: Record<string, Intl.DateTimeFormat> = {};
function dateFormatter(locale: string) {
  if (!dateFormatters[locale])
    dateFormatters[locale] = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  return dateFormatters[locale];
}

export function formatDate(d: string | Date, locale: string = "en-GB") {
  const date = typeof d === "string" ? new Date(d) : d;
  return dateFormatter(locale).format(date);
}

/**
 * VAT breakdown — assumes the given total is VAT-INCLUSIVE (per PRD).
 *   total = subtotal + vat
 *   vat = total * pct / (100 + pct)
 *
 * Pass vatPercent = 0 to skip VAT (returns whole total as subtotal).
 */
export function vatBreakdown(total: number, vatPercent: number) {
  const t = Number(total) || 0;
  const p = Number(vatPercent) || 0;
  if (p <= 0) return { subtotal: t, vat: 0, total: t, vatPercent: 0 };
  const vat = (t * p) / (100 + p);
  return {
    subtotal: t - vat,
    vat,
    total: t,
    vatPercent: p,
  };
}
