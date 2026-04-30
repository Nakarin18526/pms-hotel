import { cookies } from "next/headers";
import type { Locale } from "./i18n";

export function getLocale(): Locale {
  const c = cookies().get("locale")?.value;
  if (c === "en" || c === "zh") return c;
  return "th";
}
