"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function DevCheckoutPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    // Dev-only: directly mark booking paid via NestJS admin endpoint is gated.
    // For dev, hit the dev confirm route on the API.
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/bookings/${params.id}/dev-confirm`,
      { method: "POST" },
    );
    setLoading(false);
    if (!r.ok) {
      alert("ไม่สามารถยืนยันได้ในโหมด dev — โปรดตั้งค่า Stripe");
      return;
    }
    router.push(`/booking/${params.id}/confirmation`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 max-w-md text-center">
        <Link
          href="/book"
          className="inline-flex items-center text-sm text-slate-600 hover:text-brand mb-3"
        >
          ← กลับไปหน้าจอง
        </Link>
        <h1 className="text-xl font-bold mb-3">โหมด Dev — Stripe ยังไม่ถูกตั้งค่า</h1>
        <p className="text-sm text-slate-600 mb-4">
          กดปุ่มด้านล่างเพื่อจำลองการชำระเงินสำเร็จ
        </p>
        <p className="text-xs text-slate-500 mb-6">
          Booking ID: {params.id}
          <br />
          Session: {search.get("session_id")}
        </p>
        <button onClick={pay} disabled={loading} className="btn-primary w-full">
          {loading ? "กำลังยืนยัน..." : "จำลองการชำระเงินสำเร็จ"}
        </button>
      </div>
    </main>
  );
}
