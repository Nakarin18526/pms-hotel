"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";
import { formatPrice } from "@/lib/format";
import { useLocale } from "@/components/LocaleProvider";

interface PromptPayInfo {
  id: string;
  name: string;
  qrDataUrl: string;
}
interface BankInfo {
  name: string;
  accountNumber: string;
  accountName: string;
}
interface Instr {
  type: "PROMPTPAY" | "BANK_ACCOUNT";
  bookingId: string;
  amount: number;
  currency: string;
  /** Always present in PROMPTPAY mode; optional in BANK_ACCOUNT mode if admin enabled QR alongside */
  promptpay?: PromptPayInfo;
  /** Present in BANK_ACCOUNT mode */
  bank?: BankInfo;
  notes?: string | null;
}

interface Props {
  booking: any;
  qr: Instr;
}

export default function PromptPayClient({ booking, qr }: Props) {
  const router = useRouter();
  const { t } = useLocale();
  const [slipUrl, setSlipUrl] = useState<string[]>(
    booking.slipUrl ? [booking.slipUrl] : [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(
    booking.paymentStatus === "AWAITING_VERIFICATION",
  );
  // Default to QR if available — most guests prefer scanning over typing account numbers
  const [tab, setTab] = useState<"qr" | "bank">(
    qr.promptpay ? "qr" : "bank",
  );

  async function submitSlip() {
    if (slipUrl.length === 0) {
      setError(t("pay.uploadSlip"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/payment/promptpay/${booking.id}/slip`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slipUrl: slipUrl[0] }),
        },
      );
      if (!r.ok) throw new Error(await r.text());
      setSubmitted(true);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="card p-10 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-2xl mb-4">
          ⏳
        </div>
        <h2 className="font-serif text-2xl">{t("pay.uploaded")}</h2>
        <p className="text-slate-600 mt-2 text-sm">{t("pay.uploadedHint")}</p>
        {slipUrl[0] && (
          <img
            src={slipUrl[0]}
            alt="slip"
            className="mt-6 mx-auto max-h-80 rounded-lg border border-slate-200"
          />
        )}
        <div className="flex gap-3 mt-6 justify-center">
          <button
            onClick={() => setSubmitted(false)}
            className="btn-secondary text-sm"
          >
            {t("pay.editSlip")}
          </button>
          <a href="/account" className="btn-primary text-sm">
            {t("conf.bookHistory")}
          </a>
        </div>
      </div>
    );
  }

  const hasQR = !!qr.promptpay;
  const hasBank = !!qr.bank;
  const showTabs = hasQR && hasBank;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Payment instructions */}
      <div className="card p-8 text-center">
        <div className="text-xs uppercase tracking-wider text-slate-500 mb-1 num">
          {t("conf.bookingId")} #{booking.id.slice(0, 8)}
        </div>
        <div className="price text-4xl text-brand-800 mt-1">
          {formatPrice(qr.amount)}
        </div>
        <p className="text-xs text-slate-500 mt-1">{t("pay.amountDue")}</p>

        {/* Tabs when both methods are available */}
        {showTabs && (
          <div className="mt-6 inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => setTab("qr")}
              className={
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors " +
                (tab === "qr"
                  ? "bg-white text-brand-800 shadow-soft"
                  : "text-slate-600 hover:text-slate-900")
              }
            >
              📱 {t("pay.tab.qr")}
            </button>
            <button
              type="button"
              onClick={() => setTab("bank")}
              className={
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors " +
                (tab === "bank"
                  ? "bg-white text-brand-800 shadow-soft"
                  : "text-slate-600 hover:text-slate-900")
              }
            >
              🏦 {t("pay.tab.bank")}
            </button>
          </div>
        )}

        {/* QR view */}
        {(tab === "qr" || (!showTabs && hasQR)) && qr.promptpay && (
          <div className="mt-5">
            <div className="inline-block bg-white p-3 rounded-xl border-2 border-brand-700/30 shadow-soft">
              <img
                src={qr.promptpay.qrDataUrl}
                alt="PromptPay QR"
                className="w-64 h-64"
              />
            </div>
            <div className="text-sm space-y-1 mt-4">
              <div className="text-slate-700">
                <b>{qr.promptpay.name}</b>
              </div>
              <div className="text-slate-500 text-xs num">
                PromptPay ID: {qr.promptpay.id}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                {t("pay.scanWithApp")}
              </p>
            </div>
          </div>
        )}

        {/* Bank info view */}
        {(tab === "bank" || (!showTabs && hasBank)) && qr.bank && (
          <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-5 mt-6 space-y-3">
            <CopyRow label={t("pay.bankLabel")} value={qr.bank.name} />
            <CopyRow
              label={t("pay.accountNumber")}
              value={qr.bank.accountNumber}
              emphasize
              numeric
            />
            <CopyRow label={t("pay.accountName")} value={qr.bank.accountName} />
            <CopyRow
              label={t("pay.amountDue")}
              value={formatPrice(qr.amount)}
              emphasize
              numeric
            />
            <p className="text-xs text-slate-500 text-center pt-2">
              {t("pay.transferToAccount")}
            </p>
          </div>
        )}

        {qr.notes && (
          <div className="mt-4 text-xs bg-amber-50 border border-amber-200 rounded-md p-2 text-amber-900 text-left">
            <b>📌</b> {qr.notes}
          </div>
        )}
      </div>

      {/* Slip upload */}
      <div className="card p-8">
        <h2 className="font-serif text-xl mb-2">{t("pay.uploadSlip")}</h2>
        <p className="text-sm text-slate-600 mb-5">{t("pay.uploadHint")}</p>

        <ImageUploader
          value={slipUrl}
          onChange={(urls) => setSlipUrl(urls.slice(-1))}
          endpoint="/api/uploads/slips"
          multiple={false}
        />

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 mt-4 space-y-1">
          <div className="font-medium text-slate-800">📌 {t("pay.slipTipsTitle")}</div>
          <div>• {t("pay.slipTip1")}</div>
          <div>• {t("pay.slipTip2")}</div>
          <div>• {t("pay.slipTip3")}</div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={submitSlip}
          disabled={submitting || slipUrl.length === 0}
          className="btn-primary w-full mt-5"
        >
          {submitting ? t("common.saving") : t("pay.submitSlip")}
        </button>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  emphasize,
  numeric,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  numeric?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500">
          {label}
        </div>
        <div
          className={
            "mt-0.5 " +
            (emphasize
              ? "price text-xl text-brand-800"
              : numeric
                ? "num text-slate-900 font-medium"
                : "text-slate-900 font-medium")
          }
        >
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={copy}
        className="text-xs text-brand-700 hover:text-brand-900 px-2 py-1 rounded hover:bg-brand-50 self-center"
      >
        {copied ? "✓" : "Copy"}
      </button>
    </div>
  );
}
