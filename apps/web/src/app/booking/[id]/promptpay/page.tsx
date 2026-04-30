import { api } from "@/lib/api";
import Link from "next/link";
import PromptPayClient from "./PromptPayClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function PromptPayPage({ params }: Props) {
  let booking: any;
  let qr: any;
  try {
    booking = await api(`/api/bookings/${params.id}`);
    qr = await api(`/api/payment/promptpay/${params.id}/qr`);
  } catch (e: any) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-ivory">
        <div className="card p-10 max-w-md text-center">
          <h1 className="font-serif text-2xl">ไม่สามารถโหลดข้อมูลการจองได้</h1>
          <p className="text-slate-600 text-sm mt-2">{e.message}</p>
          <Link href="/" className="text-brand-700 hover:underline mt-4 inline-block">
            กลับหน้าแรก
          </Link>
        </div>
      </main>
    );
  }

  if (booking.paymentStatus === "PAID") {
    redirect(`/booking/${params.id}/confirmation`);
  }

  return (
    <main className="min-h-screen bg-ivory">
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg">
            AURELIA
            <span className="ml-1 text-[10px] tracking-[0.3em] text-gold-700">
              HOTEL
            </span>
          </Link>
          <Link href={`/account`} className="text-sm text-slate-500 hover:text-brand-700">
            ดูการจองทั้งหมด →
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <span className="eyebrow">Payment</span>
          <h1 className="font-serif text-4xl mt-2">
            {qr.type === "PROMPTPAY"
              ? "ชำระเงินผ่าน PromptPay"
              : "โอนผ่านบัญชีธนาคาร"}
          </h1>
          <p className="text-slate-600 mt-2 text-sm">
            {qr.type === "PROMPTPAY"
              ? "สแกน QR แล้วโอนเงินตามจำนวนที่แสดง จากนั้นอัปโหลดสลิปยืนยัน"
              : "โอนเงินตามข้อมูลบัญชีด้านล่าง จากนั้นอัปโหลดสลิปยืนยัน"}
          </p>
        </div>

        <PromptPayClient booking={booking} qr={qr} />
      </div>
    </main>
  );
}
