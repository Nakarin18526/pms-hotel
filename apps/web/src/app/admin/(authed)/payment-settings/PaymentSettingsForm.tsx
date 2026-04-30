"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const THAI_BANKS = [
  "ธนาคารกสิกรไทย (KBANK)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารกรุงศรีอยุธยา (BAY)",
  "ธนาคารทหารไทยธนชาต (TTB)",
  "ธนาคารยูโอบี (UOB)",
  "ธนาคารซีไอเอ็มบี ไทย (CIMB)",
  "ธนาคารออมสิน (GSB)",
];

export default function PaymentSettingsForm({ initial }: { initial: any }) {
  const { data: session } = useSession();
  const router = useRouter();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [transferType, setTransferType] = useState<"PROMPTPAY" | "BANK_ACCOUNT">(
    initial.transferType ?? "PROMPTPAY",
  );
  const [promptpayId, setPromptpayId] = useState(initial.promptpayId ?? "");
  const [promptpayName, setPromptpayName] = useState(initial.promptpayName ?? "");
  const [bankName, setBankName] = useState(initial.bankName ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(
    initial.bankAccountNumber ?? "",
  );
  const [bankAccountName, setBankAccountName] = useState(
    initial.bankAccountName ?? "",
  );
  const [bankPromptpayId, setBankPromptpayId] = useState(
    initial.bankPromptpayId ?? "",
  );
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await fetch(`${API}/api/admin/payment-settings`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          transferType,
          promptpayId,
          promptpayName,
          bankName,
          bankAccountNumber,
          bankAccountName,
          bankPromptpayId,
          notes,
        }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.message ?? (await r.text()));
      }
      setMsg("✓ บันทึกการตั้งค่าแล้ว");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Method picker */}
      <div className="card p-6">
        <label className="label mb-3">วิธีรับเงิน</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTransferType("PROMPTPAY")}
            className={
              "p-4 rounded-lg border-2 text-left transition-all " +
              (transferType === "PROMPTPAY"
                ? "border-brand-700 bg-brand-50"
                : "border-slate-200 hover:border-slate-300")
            }
          >
            <div className="text-2xl mb-1">📱</div>
            <div className="font-medium text-sm">PromptPay (สร้าง QR อัตโนมัติ)</div>
            <div className="text-xs text-slate-500 mt-0.5">
              ระบบจะ generate QR พร้อมยอดเงินให้แขกสแกน
            </div>
          </button>
          <button
            type="button"
            onClick={() => setTransferType("BANK_ACCOUNT")}
            className={
              "p-4 rounded-lg border-2 text-left transition-all " +
              (transferType === "BANK_ACCOUNT"
                ? "border-brand-700 bg-brand-50"
                : "border-slate-200 hover:border-slate-300")
            }
          >
            <div className="text-2xl mb-1">🏦</div>
            <div className="font-medium text-sm">เลขบัญชีธนาคาร</div>
            <div className="text-xs text-slate-500 mt-0.5">
              แสดงเลขบัญชีให้แขกโอนเอง
            </div>
          </button>
        </div>
      </div>

      {transferType === "PROMPTPAY" && (
        <div className="card p-6 space-y-4">
          <h3 className="font-serif text-lg">ข้อมูล PromptPay</h3>
          <div>
            <label className="label">PromptPay ID</label>
            <input
              value={promptpayId}
              onChange={(e) => setPromptpayId(e.target.value)}
              className="input"
              placeholder="0812345678 (เบอร์โทร) หรือ 1234567890123 (เลขบัตรประชาชน)"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              เบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลัก ที่ลงทะเบียน PromptPay
              ไว้แล้ว
            </p>
          </div>
          <div>
            <label className="label">ชื่อผู้รับ</label>
            <input
              value={promptpayName}
              onChange={(e) => setPromptpayName(e.target.value)}
              className="input"
              placeholder="เช่น โรงแรม Aurelia"
              required
            />
          </div>
        </div>
      )}

      {transferType === "BANK_ACCOUNT" && (
        <div className="card p-6 space-y-4">
          <h3 className="font-serif text-lg">ข้อมูลบัญชีธนาคาร</h3>
          <div>
            <label className="label">ธนาคาร</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="input"
              required
            >
              <option value="">— เลือกธนาคาร —</option>
              {THAI_BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">เลขที่บัญชี</label>
            <input
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              className="input"
              placeholder="123-4-56789-0"
              required
            />
          </div>
          <div>
            <label className="label">ชื่อบัญชี</label>
            <input
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              className="input"
              placeholder="บริษัท / บุคคล ชื่อบัญชีตามสมุด"
              required
            />
          </div>

          {/* Optional: also show QR code alongside bank info */}
          <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50/30 p-4 mt-2">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-slate-800">
                  📱 เพิ่ม QR (ทางเลือก)
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  ใส่ PromptPay ID ที่ผูกกับบัญชีนี้ → แขกจะเห็นทั้งเลขบัญชีและ QR
                  สลับเลือกได้ในหน้าชำระเงิน
                </div>
              </div>
            </div>
            <input
              value={bankPromptpayId}
              onChange={(e) => setBankPromptpayId(e.target.value)}
              className="input num"
              placeholder="0812345678 หรือ 1234567890123 (เว้นว่างถ้าไม่ต้องการ QR)"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              เบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลัก ที่ลงทะเบียน PromptPay แล้ว
            </p>
          </div>
        </div>
      )}

      <div className="card p-6">
        <label className="label">หมายเหตุเพิ่มเติม (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="input"
          placeholder="เช่น โอนแล้วกรุณาส่งสลิปภายใน 30 นาที"
        />
      </div>

      {err && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {err}
        </div>
      )}
      {msg && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
          {msg}
        </div>
      )}

      <button className="btn-primary" disabled={busy}>
        {busy ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
      </button>
    </form>
  );
}
