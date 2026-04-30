-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "hotelName" TEXT NOT NULL DEFAULT 'Aurelia',
    "brandTagline" TEXT NOT NULL DEFAULT 'HOTEL',
    "heroEyebrow" TEXT NOT NULL DEFAULT 'BOUTIQUE · HERITAGE · SERENE',
    "heroTitle" TEXT NOT NULL DEFAULT 'ประสบการณ์การพักผ่อน',
    "heroTitleAccent" TEXT NOT NULL DEFAULT 'เหนือระดับ',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'จองห้องพักโดยตรงผ่านเว็บไซต์ทางการของเรา รับราคาดีที่สุด พร้อมการยืนยันทันที โดยไม่ผ่านตัวกลาง',
    "heroImageUrl" TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=2000&q=85',
    "heroCtaPrimary" TEXT NOT NULL DEFAULT 'จองห้องพัก',
    "heroCtaSecondary" TEXT NOT NULL DEFAULT 'ดูห้องพัก',
    "feature1Title" TEXT NOT NULL DEFAULT 'ราคาดีที่สุดรับรอง',
    "feature1Desc" TEXT NOT NULL DEFAULT 'จองตรงไม่ผ่านตัวกลาง ไม่มีค่าคอมมิชชั่นแอบแฝง — ราคาที่คุณเห็นคือราคาที่จ่าย',
    "feature2Title" TEXT NOT NULL DEFAULT 'ยืนยันทันที',
    "feature2Desc" TEXT NOT NULL DEFAULT 'ระบบยืนยันการจองอัตโนมัติพร้อมอีเมลรายละเอียดเข้าพัก ไม่ต้องรอตอบกลับ',
    "feature3Title" TEXT NOT NULL DEFAULT 'บริการระดับมืออาชีพ',
    "feature3Desc" TEXT NOT NULL DEFAULT 'ทีมงานพร้อมดูแลตลอด 24 ชั่วโมง ติดต่อโดยตรงโดยไม่ผ่านบุคคลที่สาม',
    "footerTagline" TEXT NOT NULL DEFAULT 'โรงแรมหรูระดับบูทีก ใจกลางเมือง บริการระดับมืออาชีพ จองโดยตรงเพื่อราคาดีที่สุดและไม่มีค่าธรรมเนียมตัวกลาง',
    "contactAddress" TEXT NOT NULL DEFAULT '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
    "contactPhone" TEXT NOT NULL DEFAULT '02-000-0000',
    "contactEmail" TEXT NOT NULL DEFAULT 'info@hotel.com',
    "cancellationPolicy" TEXT NOT NULL DEFAULT 'การจองทุกรายการ ไม่สามารถขอคืนเงินได้ในทุกกรณี (All sales final)',
    "checkInTime" TEXT NOT NULL DEFAULT 'ตั้งแต่ 14:00',
    "checkOutTime" TEXT NOT NULL DEFAULT 'ก่อน 12:00',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);
