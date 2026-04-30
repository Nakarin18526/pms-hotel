import { api } from "./api";

export interface SiteSettings {
  hotelName: string;
  brandTagline: string;
  heroEyebrow: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  footerTagline: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  cancellationPolicy: string;
  checkInTime: string;
  checkOutTime: string;
  vatPercent: number | string;
  vatLabel: string;
}

const FALLBACK: SiteSettings = {
  hotelName: "Aurelia",
  brandTagline: "HOTEL",
  heroEyebrow: "BOUTIQUE · HERITAGE · SERENE",
  heroTitle: "ประสบการณ์การพักผ่อน",
  heroTitleAccent: "เหนือระดับ",
  heroSubtitle:
    "จองห้องพักโดยตรงผ่านเว็บไซต์ทางการของเรา รับราคาดีที่สุด พร้อมการยืนยันทันที โดยไม่ผ่านตัวกลาง",
  heroImageUrl:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=2000&q=85",
  heroCtaPrimary: "จองห้องพัก",
  heroCtaSecondary: "ดูห้องพัก",
  feature1Title: "ราคาดีที่สุดรับรอง",
  feature1Desc: "จองตรงไม่ผ่านตัวกลาง",
  feature2Title: "ยืนยันทันที",
  feature2Desc: "ระบบยืนยันการจองอัตโนมัติ",
  feature3Title: "บริการระดับมืออาชีพ",
  feature3Desc: "ทีมงานพร้อมดูแลตลอด 24 ชั่วโมง",
  footerTagline: "โรงแรมหรูระดับบูทีก",
  contactAddress: "—",
  contactPhone: "—",
  contactEmail: "—",
  cancellationPolicy:
    "การจองทุกรายการ ไม่สามารถขอคืนเงินได้ในทุกกรณี (All sales final)",
  checkInTime: "ตั้งแต่ 14:00",
  checkOutTime: "ก่อน 12:00",
  vatPercent: 7,
  vatLabel: "VAT",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    return await api<SiteSettings>("/api/site-settings");
  } catch {
    return FALLBACK;
  }
}
