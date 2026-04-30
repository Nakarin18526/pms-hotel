"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function SlipVerifier({
  bookingId,
  expected,
}: {
  bookingId: string;
  expected: number;
}) {
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;
  const router = useRouter();

  const [amount, setAmount] = useState<string>(String(expected));
  const [busy, setBusy] = useState<"verify" | "reject" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function verify() {
    setMsg(null);
    setBusy("verify");
    try {
      const r = await fetch(
        `${API}/api/payment/promptpay/${bookingId}/verify`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({ verifiedAmount: Number(amount) }),
        },
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message ?? (await r.text()));
      }
      setMsg("✓ ยืนยันการชำระเงินสำเร็จ");
      router.refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!confirm("ปฏิเสธสลิปนี้? แขกจะอัปโหลดใหม่ได้")) return;
    setBusy("reject");
    setMsg(null);
    try {
      const r = await fetch(
        `${API}/api/payment/promptpay/${bookingId}/reject`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${apiToken}` },
        },
      );
      if (!r.ok) throw new Error(await r.text());
      setMsg("ปฏิเสธสลิปแล้ว");
      router.refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(null);
    }
  }

  const amountNum = Number(amount);
  const matches = !isNaN(amountNum) && Math.abs(amountNum - expected) < 0.01;

  return (
    <div className="border-t border-purple-200 pt-4">
      <label className="label">จำนวนเงินที่อ่านได้จากสลิป (บาท)</label>
      <div className="flex gap-2 items-start">
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input flex-1"
        />
        <div
          className={
            "px-3 py-2.5 rounded-md text-xs font-medium whitespace-nowrap " +
            (matches
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
              : "bg-red-50 text-red-700 ring-1 ring-red-600/20")
          }
        >
          {matches
            ? "✓ ตรงกับยอดจอง"
            : `✗ ต่างกัน ${formatPrice(Math.abs(amountNum - expected))}`}
        </div>
      </div>

      {msg && (
        <p
          className={
            "text-sm mt-3 px-3 py-2 rounded-md " +
            (msg.startsWith("✓")
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200")
          }
        >
          {msg}
        </p>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={verify}
          disabled={!matches || busy !== null}
          className="btn-primary"
        >
          {busy === "verify" ? "กำลังยืนยัน..." : "ยืนยันการชำระเงิน"}
        </button>
        <button
          onClick={reject}
          disabled={busy !== null}
          className="btn-danger"
        >
          {busy === "reject" ? "..." : "ปฏิเสธสลิป"}
        </button>
      </div>
    </div>
  );
}
