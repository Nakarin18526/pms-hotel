"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function SiteSettingsForm({ initial }: { initial: any }) {
  const { data: session } = useSession();
  const router = useRouter();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [s, setS] = useState<Record<string, string>>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(
    null,
  );

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setS({ ...s, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      // Strip non-string fields like updatedAt before sending
      const { id, updatedAt, ...payload } = s as any;
      const r = await fetch(`${API}/api/admin/site-settings`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message ?? (await r.text()));
      }
      setMsg({ kind: "success", text: "✓ บันทึกแล้ว — หน้าแขกจะอัปเดตทันที" });
      router.refresh();
    } catch (e: any) {
      setMsg({ kind: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <Section title="แบรนด์">
        <Field label="ชื่อโรงแรม" v={s.hotelName} onChange={update("hotelName")} />
        <Field
          label="คำต่อท้ายชื่อ (เช่น HOTEL)"
          v={s.brandTagline}
          onChange={update("brandTagline")}
        />
      </Section>

      <Section title="หน้าแรก — Hero">
        <Field
          label="Eyebrow (ข้อความเล็กด้านบน)"
          v={s.heroEyebrow}
          onChange={update("heroEyebrow")}
        />
        <Field label="หัวข้อหลัก" v={s.heroTitle} onChange={update("heroTitle")} />
        <Field
          label="คำเน้น (ตัวเอียงสีทอง)"
          v={s.heroTitleAccent}
          onChange={update("heroTitleAccent")}
        />
        <FieldText
          label="คำบรรยายใต้หัวข้อ"
          v={s.heroSubtitle}
          onChange={update("heroSubtitle")}
        />
        <Field
          label="ปุ่มหลัก (CTA Primary)"
          v={s.heroCtaPrimary}
          onChange={update("heroCtaPrimary")}
        />
        <Field
          label="ปุ่มสำรอง (CTA Secondary)"
          v={s.heroCtaSecondary}
          onChange={update("heroCtaSecondary")}
        />
        <div>
          <label className="label">รูป Hero (เต็มจอบนหน้าแรก)</label>
          <ImageUploader
            value={s.heroImageUrl ? [s.heroImageUrl] : []}
            onChange={(urls) => setS({ ...s, heroImageUrl: urls[0] ?? "" })}
            apiToken={apiToken}
            multiple={false}
          />
        </div>
      </Section>

      <Section title="3 จุดเด่น (ทำไมต้องจองโดยตรง)">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-l-2 border-gold-300 pl-3 space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Feature {i}
            </div>
            <Field
              label="หัวข้อ"
              v={s[`feature${i}Title`] ?? ""}
              onChange={update(`feature${i}Title`)}
            />
            <FieldText
              label="คำอธิบาย"
              v={s[`feature${i}Desc`] ?? ""}
              onChange={update(`feature${i}Desc`)}
            />
          </div>
        ))}
      </Section>

      <Section title="Footer / ติดต่อ">
        <FieldText
          label="คำบรรยายใน footer"
          v={s.footerTagline}
          onChange={update("footerTagline")}
        />
        <Field
          label="ที่อยู่"
          v={s.contactAddress}
          onChange={update("contactAddress")}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="เบอร์โทร"
            v={s.contactPhone}
            onChange={update("contactPhone")}
          />
          <Field
            label="อีเมลติดต่อ"
            v={s.contactEmail}
            onChange={update("contactEmail")}
          />
        </div>
      </Section>

      <Section title="นโยบายและเวลา">
        <FieldText
          label="นโยบายการยกเลิก"
          v={s.cancellationPolicy}
          onChange={update("cancellationPolicy")}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="เวลาเช็คอิน"
            v={s.checkInTime}
            onChange={update("checkInTime")}
          />
          <Field
            label="เวลาเช็คเอาต์"
            v={s.checkOutTime}
            onChange={update("checkOutTime")}
          />
        </div>
      </Section>

      <Section title="ภาษีมูลค่าเพิ่ม (VAT)">
        <p className="text-xs text-slate-500 -mt-2 mb-2">
          ราคาห้องที่แอดมินตั้งคือ <b>ราคารวม VAT แล้ว</b> (all-inclusive) —
          ระบบจะแยกให้ดูในใบเสร็จเพื่อความโปร่งใส กรอก <b>0</b> ถ้าไม่ต้องการแสดง VAT
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="VAT (%)"
            v={String(s.vatPercent ?? 7)}
            onChange={update("vatPercent")}
          />
          <Field
            label="ป้ายชื่อภาษี"
            v={s.vatLabel ?? "VAT"}
            onChange={update("vatLabel")}
          />
        </div>
      </Section>

      {msg && (
        <div
          className={
            "px-3 py-2 rounded-md text-sm border " +
            (msg.kind === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200")
          }
        >
          {msg.text}
        </div>
      )}

      <div className="sticky bottom-3 bg-white p-3 rounded-lg shadow-lift border border-slate-200 flex justify-end">
        <button className="btn-primary" disabled={busy}>
          {busy ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลงทั้งหมด"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6 space-y-4">
      <h2 className="font-serif text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  v,
  onChange,
}: {
  label: string;
  v: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input value={v ?? ""} onChange={onChange} className="input" />
    </div>
  );
}

function FieldText({
  label,
  v,
  onChange,
}: {
  label: string;
  v: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea value={v ?? ""} onChange={onChange} rows={3} className="input" />
    </div>
  );
}
