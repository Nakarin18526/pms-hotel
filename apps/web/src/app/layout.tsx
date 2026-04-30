import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Inter,
  IBM_Plex_Sans_Thai,
  Noto_Sans_SC,
} from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import LocaleProvider from "@/components/LocaleProvider";
import type { Locale } from "@/lib/i18n";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const thai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-thai",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const chinese = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-chinese",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hotel — Direct Booking",
  description:
    "Direct hotel booking — best rates guaranteed, instant confirmation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localeCookie = cookies().get("locale")?.value;
  const locale: Locale =
    localeCookie === "en" || localeCookie === "zh" ? localeCookie : "th";
  return (
    <html
      lang={locale}
      className={`${display.variable} ${body.variable} ${thai.variable} ${chinese.variable} locale-${locale}`}
    >
      <body>
        <LocaleProvider initial={locale}>
          <SessionProvider>{children}</SessionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
