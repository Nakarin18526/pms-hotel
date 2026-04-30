export type Locale = "th" | "en" | "zh";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

const dict = {
  // Navigation
  "nav.book": { th: "จองห้องพัก", en: "Book Now", zh: "立即预订" },
  "nav.account": { th: "บัญชีของฉัน", en: "My Account", zh: "我的账户" },
  "nav.login": { th: "เข้าสู่ระบบ", en: "Sign In", zh: "登录" },
  "nav.logout": { th: "ออกจากระบบ", en: "Sign Out", zh: "退出登录" },
  "nav.home": { th: "หน้าแรก", en: "Home", zh: "首页" },
  "nav.register": { th: "สมัครสมาชิก", en: "Sign Up", zh: "注册" },
  "nav.back": { th: "ย้อนกลับ", en: "Back", zh: "返回" },
  "nav.backHome": {
    th: "← กลับหน้าแรก",
    en: "← Back to home",
    zh: "← 返回首页",
  },

  // Common
  "common.loading": { th: "กำลังโหลด…", en: "Loading…", zh: "加载中…" },
  "common.saving": { th: "กำลังบันทึก…", en: "Saving…", zh: "保存中…" },
  "common.save": { th: "บันทึก", en: "Save", zh: "保存" },
  "common.cancel": { th: "ยกเลิก", en: "Cancel", zh: "取消" },
  "common.confirm": { th: "ยืนยัน", en: "Confirm", zh: "确认" },
  "common.email": { th: "อีเมล", en: "Email", zh: "邮箱" },
  "common.password": { th: "รหัสผ่าน", en: "Password", zh: "密码" },
  "common.name": { th: "ชื่อ-นามสกุล", en: "Full Name", zh: "姓名" },
  "common.phone": { th: "เบอร์โทร", en: "Phone", zh: "电话" },
  "common.or": { th: "หรือ", en: "or", zh: "或" },
  "common.refresh": { th: "รีเฟรช", en: "Refresh", zh: "刷新" },
  "common.signInWithGoogle": {
    th: "เข้าสู่ระบบด้วย Google",
    en: "Sign in with Google",
    zh: "使用 Google 登录",
  },
  "common.signUpWithGoogle": {
    th: "สมัครด้วย Google",
    en: "Sign up with Google",
    zh: "使用 Google 注册",
  },

  // Auth
  "auth.welcomeBack": {
    th: "Welcome back",
    en: "Welcome back",
    zh: "欢迎回来",
  },
  "auth.signIn": { th: "เข้าสู่ระบบ", en: "Sign in", zh: "登录" },
  "auth.signingIn": {
    th: "กำลังเข้าสู่ระบบ…",
    en: "Signing in…",
    zh: "登录中…",
  },
  "auth.invalidCredentials": {
    th: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    en: "Invalid email or password",
    zh: "邮箱或密码错误",
  },
  "auth.noAccount": {
    th: "ยังไม่มีบัญชี?",
    en: "Don't have an account?",
    zh: "还没有账户?",
  },
  "auth.haveAccount": {
    th: "มีบัญชีอยู่แล้ว?",
    en: "Already have an account?",
    zh: "已有账户?",
  },
  "auth.createAccount": {
    th: "Create an account",
    en: "Create an account",
    zh: "创建账户",
  },
  "auth.signUp": { th: "สมัครสมาชิก", en: "Sign up", zh: "注册" },
  "auth.signingUp": {
    th: "กำลังสมัคร…",
    en: "Signing up…",
    zh: "注册中…",
  },
  "auth.passwordHint": {
    th: "รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)",
    en: "Password (at least 8 characters)",
    zh: "密码 (至少8位)",
  },

  // Home page
  "home.whyEyebrow": {
    th: "Why book direct",
    en: "Why book direct",
    zh: "为何直接预订",
  },
  "home.whyTitle": {
    th: "เหตุผลที่จองกับเราโดยตรง",
    en: "Reasons to book directly with us",
    zh: "选择官网预订的理由",
  },
  "home.accommodationsEyebrow": {
    th: "Accommodations",
    en: "Accommodations",
    zh: "房型",
  },
  "home.accommodationsTitle": {
    th: "ห้องพัก & สวีท",
    en: "Rooms & Suites",
    zh: "客房与套房",
  },
  "home.checkAvailability": {
    th: "ตรวจสอบความว่าง →",
    en: "Check availability →",
    zh: "查看空房 →",
  },
  "home.bookCta": { th: "จองเลย →", en: "Book now →", zh: "立即预订 →" },
  "home.makeReservationEyebrow": {
    th: "Make a reservation",
    en: "Make a reservation",
    zh: "立即预订",
  },
  "home.ctaTitle": {
    th: "พร้อมเริ่มต้นประสบการณ์ของคุณแล้วหรือยัง",
    en: "Ready to begin your stay?",
    zh: "准备开启您的旅程?",
  },
  "home.ctaDesc": {
    th: "เลือกวันที่เข้าพัก เลือกห้อง และยืนยันได้ในไม่กี่นาที",
    en: "Pick your dates, choose a room, and confirm in minutes",
    zh: "选择日期、选定房间,几分钟内完成预订",
  },
  "home.noRooms": {
    th: "ไม่มีห้องพักในระบบ",
    en: "No rooms available",
    zh: "暂无房型",
  },

  // Booking
  "booking.title": {
    th: "จองห้องพัก",
    en: "Book Your Stay",
    zh: "预订您的住宿",
  },
  "booking.reservation": {
    th: "Reservation",
    en: "Reservation",
    zh: "预订",
  },
  "booking.subtitle": {
    th: "เลือกวันที่ ห้องพัก และยืนยันใน 3 ขั้นตอน",
    en: "Pick dates, choose a room, and confirm in 3 steps",
    zh: "选择日期、客房,3 步完成确认",
  },
  "booking.step.dates": {
    th: "เลือกวันที่",
    en: "Select Dates",
    zh: "选择日期",
  },
  "booking.step.rooms": { th: "เลือกห้อง", en: "Choose Room", zh: "选择房间" },
  "booking.step.guest": {
    th: "ยืนยันและชำระเงิน",
    en: "Confirm & Pay",
    zh: "确认与付款",
  },
  "booking.checkIn": { th: "เช็คอิน", en: "Check-in", zh: "入住" },
  "booking.checkOut": { th: "เช็คเอาต์", en: "Check-out", zh: "退房" },
  "booking.nights": { th: "คืน", en: "nights", zh: "晚" },
  "booking.duration": { th: "ระยะเวลา", en: "Duration", zh: "时长" },
  "booking.searchRooms": {
    th: "ค้นหาห้องว่าง",
    en: "Search Rooms",
    zh: "搜索空房",
  },
  "booking.searching": {
    th: "กำลังค้นหา…",
    en: "Searching…",
    zh: "搜索中…",
  },
  "booking.changeDates": {
    th: "เปลี่ยนวันที่",
    en: "Change dates",
    zh: "更改日期",
  },
  "booking.lastUpdated": { th: "อัปเดต", en: "Updated", zh: "更新于" },
  "booking.guestInfo": {
    th: "ข้อมูลผู้เข้าพัก",
    en: "Guest Information",
    zh: "入住人信息",
  },
  "booking.guestInfoNote": {
    th: "กรุณากรอกข้อมูลให้ตรงตามบัตรประชาชน/พาสปอร์ต",
    en: "Enter information matching your ID or passport",
    zh: "请填写与您证件一致的信息",
  },
  "booking.paymentMethod": {
    th: "วิธีชำระเงิน",
    en: "Payment Method",
    zh: "付款方式",
  },
  "booking.transferQR": {
    th: "โอนเงิน / QR",
    en: "Bank Transfer / QR",
    zh: "银行转账 / QR",
  },
  "booking.transferQRHint": {
    th: "PromptPay หรือโอนเข้าบัญชี + สลิป",
    en: "PromptPay or bank account + slip",
    zh: "PromptPay 或银行转账 + 凭证",
  },
  "booking.creditCard": { th: "บัตรเครดิต", en: "Credit Card", zh: "信用卡" },
  "booking.creditCardHint": {
    th: "Visa, Mastercard via Stripe",
    en: "Visa, Mastercard via Stripe",
    zh: "Visa、Mastercard (通过 Stripe)",
  },
  "booking.policy": {
    th: "นโยบายการจอง",
    en: "Booking Policy",
    zh: "预订政策",
  },
  "booking.proceed": {
    th: "ดำเนินการชำระเงิน →",
    en: "Proceed to Payment →",
    zh: "前往付款 →",
  },
  "booking.chooseAnother": {
    th: "← เลือกห้องอื่น",
    en: "← Choose another room",
    zh: "← 选择其他房间",
  },
  "booking.preparing": {
    th: "กำลังเตรียมการชำระเงิน…",
    en: "Preparing payment…",
    zh: "正在准备付款…",
  },
  "booking.summary": {
    th: "สรุปการจอง",
    en: "Booking Summary",
    zh: "预订摘要",
  },
  "booking.priceBreakdown": {
    th: "รายละเอียดราคารายคืน",
    en: "Per-night breakdown",
    zh: "每晚价格明细",
  },
  "booking.totalLabel": { th: "ยอดรวม", en: "Total", zh: "总计" },
  "booking.maxGuests": { th: "สูงสุด", en: "Max", zh: "最多" },
  "booking.guests": { th: "ท่าน", en: "guests", zh: "人" },
  "booking.unitsLeft": { th: "เหลือ", en: "Available:", zh: "剩余" },
  "booking.rooms": { th: "ห้อง", en: "rooms", zh: "间" },
  "booking.selectRoom": {
    th: "เลือกห้องนี้ →",
    en: "Select Room →",
    zh: "选择此房间 →",
  },
  "booking.available": { th: "ห้องว่าง", en: "Available", zh: "有空房" },
  "booking.fullyBooked": { th: "เต็ม", en: "Fully booked", zh: "已订满" },
  "booking.noPriceRange": {
    th: "ไม่มีราคาในช่วงนี้",
    en: "No rate set",
    zh: "未设置价格",
  },
  "booking.totalNights": { th: "รวม", en: "for", zh: "共" },

  // Account
  "account.eyebrow": { th: "My account", en: "My account", zh: "我的账户" },
  "account.title": { th: "บัญชีของฉัน", en: "My Account", zh: "我的账户" },
  "account.greeting": { th: "สวัสดี", en: "Hello", zh: "您好" },
  "account.upcoming": {
    th: "การจองที่กำลังจะถึง",
    en: "Upcoming Bookings",
    zh: "即将到来的预订",
  },
  "account.history": {
    th: "ประวัติการจอง",
    en: "Booking History",
    zh: "预订历史",
  },
  "account.noBookings": {
    th: "ยังไม่มีการจอง",
    en: "No bookings yet",
    zh: "暂无预订",
  },
  "account.noBookingsHint": {
    th: "เริ่มต้นการเข้าพักครั้งแรกของคุณกับเรา",
    en: "Start your first stay with us",
    zh: "开启您的首次入住",
  },
  "account.bookNew": { th: "จองใหม่", en: "New Booking", zh: "新预订" },
  "account.viewDetails": {
    th: "ดูรายละเอียด",
    en: "View Details",
    zh: "查看详情",
  },

  // Confirmation
  "conf.bookingConfirmed": {
    th: "Booking confirmed",
    en: "Booking confirmed",
    zh: "预订已确认",
  },
  "conf.success": {
    th: "ยืนยันการจองสำเร็จ",
    en: "Booking Confirmed",
    zh: "预订成功",
  },
  "conf.successHint": {
    th: "เราได้ส่งอีเมลยืนยันให้คุณแล้ว ขอบคุณที่จองกับเรา",
    en: "A confirmation email has been sent. Thank you for booking with us.",
    zh: "确认邮件已发送。感谢您的预订。",
  },
  "conf.yourBooking": {
    th: "การจองของคุณ",
    en: "Your Booking",
    zh: "您的预订",
  },
  "conf.notPaidHint": {
    th: "การชำระเงินยังไม่สำเร็จ — กรุณารอสักครู่หรือติดต่อเจ้าหน้าที่",
    en: "Payment not yet received — please wait or contact our staff",
    zh: "付款尚未完成 — 请稍候或联系客服",
  },
  "conf.bookingId": { th: "Booking", en: "Booking", zh: "预订单" },
  "conf.bookHistory": {
    th: "ดูประวัติการจอง",
    en: "View History",
    zh: "查看历史",
  },
  "conf.bookAgain": { th: "จองอีกครั้ง", en: "Book Again", zh: "再次预订" },
  "conf.contactQuestion": {
    th: "มีคำถามเพิ่มเติม? ติดต่อเรา",
    en: "Questions? Contact us at",
    zh: "如有疑问,请联系我们",
  },
  "conf.notFound": {
    th: "ไม่พบการจอง",
    en: "Booking not found",
    zh: "未找到预订",
  },

  // Status
  "status.confirmed": { th: "ยืนยันแล้ว", en: "Confirmed", zh: "已确认" },
  "status.cancelled": { th: "ยกเลิก", en: "Cancelled", zh: "已取消" },
  "status.pending": { th: "รอดำเนินการ", en: "Pending", zh: "待处理" },
  "status.paid": { th: "ชำระแล้ว", en: "Paid", zh: "已付款" },
  "status.unpaid": { th: "ยังไม่ชำระ", en: "Unpaid", zh: "未付款" },
  "status.awaitingVerification": {
    th: "กำลังดำเนินการ",
    en: "Processing",
    zh: "处理中",
  },
  "status.awaitingPayment": {
    th: "รอชำระเงิน",
    en: "Awaiting payment",
    zh: "待付款",
  },

  // Footer
  "footer.menu": { th: "เมนู", en: "Menu", zh: "菜单" },
  "footer.contact": { th: "ติดต่อ", en: "Contact", zh: "联系我们" },
  "footer.tel": { th: "โทร:", en: "Tel:", zh: "电话:" },
  "footer.directBooking": {
    th: "Direct booking · Best rate guaranteed · No third-party fees",
    en: "Direct booking · Best rate guaranteed · No third-party fees",
    zh: "官网直订 · 最优价格保证 · 无第三方费用",
  },
  "footer.allRights": {
    th: "All rights reserved.",
    en: "All rights reserved.",
    zh: "版权所有。",
  },

  // Payment / PromptPay
  "pay.title.qr": {
    th: "ชำระเงินผ่าน PromptPay",
    en: "Pay via PromptPay",
    zh: "通过 PromptPay 付款",
  },
  "pay.title.bank": {
    th: "โอนผ่านบัญชีธนาคาร",
    en: "Bank Transfer",
    zh: "银行转账",
  },
  "pay.subtitle.qr": {
    th: "สแกน QR แล้วโอนเงินตามจำนวนที่แสดง จากนั้นอัปโหลดสลิปยืนยัน",
    en: "Scan the QR, transfer the exact amount, then upload the slip",
    zh: "扫描 QR 码,转账显示金额,然后上传付款凭证",
  },
  "pay.subtitle.bank": {
    th: "โอนเงินตามข้อมูลบัญชีด้านล่าง จากนั้นอัปโหลดสลิปยืนยัน",
    en: "Transfer to the account below, then upload the slip",
    zh: "转账至以下账户,然后上传凭证",
  },
  "pay.uploaded": {
    th: "ส่งสลิปเรียบร้อย",
    en: "Slip submitted",
    zh: "凭证已提交",
  },
  "pay.uploadedHint": {
    th: "เจ้าหน้าที่กำลังตรวจสอบสลิปของคุณ เมื่อยืนยันสำเร็จ คุณจะได้รับอีเมลแจ้งทันที",
    en: "Our staff is verifying your slip. You'll receive an email once approved.",
    zh: "工作人员正在审核您的付款凭证。审核通过后将立即发送邮件通知。",
  },
  "pay.editSlip": { th: "แก้ไขสลิป", en: "Edit slip", zh: "修改凭证" },
  "pay.amountDue": {
    th: "จำนวนที่ต้องชำระ",
    en: "Amount due",
    zh: "应付金额",
  },
  "pay.uploadSlip": {
    th: "อัปโหลดสลิปการโอนเงิน",
    en: "Upload Payment Slip",
    zh: "上传付款凭证",
  },
  "pay.uploadHint": {
    th: "หลังโอนเงินสำเร็จ ถ่ายภาพสลิปและอัปโหลดที่นี่",
    en: "After transfer, take a photo of the slip and upload it here",
    zh: "转账完成后,拍下凭证照片并上传",
  },
  "pay.submitSlip": {
    th: "ส่งสลิปยืนยัน",
    en: "Submit Slip",
    zh: "提交凭证",
  },
  "pay.tab.qr": { th: "QR Code", en: "QR Code", zh: "QR 码" },
  "pay.tab.bank": { th: "เลขบัญชี", en: "Bank Account", zh: "银行账户" },
  "pay.bankLabel": { th: "ธนาคาร", en: "Bank", zh: "银行" },
  "pay.accountNumber": {
    th: "เลขที่บัญชี",
    en: "Account Number",
    zh: "账号",
  },
  "pay.accountName": { th: "ชื่อบัญชี", en: "Account Name", zh: "户名" },
  "pay.scanWithApp": {
    th: "สแกน QR ด้วยแอปธนาคาร",
    en: "Scan with your banking app",
    zh: "用银行 App 扫码",
  },
  "pay.transferToAccount": {
    th: "โอนเงินผ่านแอปธนาคารตามข้อมูลด้านบน",
    en: "Transfer using the details above",
    zh: "请按以上信息进行转账",
  },
  "pay.slipTip1": {
    th: "ถ่ายภาพให้เห็นยอดเงินและวันเวลาชัดเจน",
    en: "Show amount and date/time clearly",
    zh: "请清晰拍出金额和时间",
  },
  "pay.slipTip2": {
    th: "ห้ามตัดต่อ ปลอมแปลง หรือแก้ไขสลิป",
    en: "Do not edit or alter the slip",
    zh: "请勿编辑或修改凭证",
  },
  "pay.slipTip3": {
    th: "ระบบจะตรวจสอบยอดเงินกับการจองของคุณ",
    en: "The system verifies the amount against your booking",
    zh: "系统会自动核对金额",
  },
  "pay.slipTipsTitle": {
    th: "ข้อแนะนำ",
    en: "Guidelines",
    zh: "提示",
  },
} as const;

export type TranslationKey = keyof typeof dict;

export function t(locale: Locale, key: TranslationKey): string {
  return dict[key]?.[locale] ?? dict[key]?.["en"] ?? key;
}
