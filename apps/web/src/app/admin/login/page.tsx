"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("admin-credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("เข้าสู่ระบบไม่สำเร็จ");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden">
      {/* decorative bg */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-20 w-96 h-96 rounded-full bg-brand-500 blur-3xl" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 rounded-full bg-gold-500 blur-3xl" />
      </div>

      <div className="card w-full max-w-md p-8 relative z-10 animate-slide-up">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-brand-700 inline-flex items-center mb-6"
        >
          ← กลับหน้าแรก
        </Link>
        <span className="eyebrow">Staff portal</span>
        <h1 className="font-serif text-3xl mt-2 mb-1">Admin</h1>
        <p className="text-sm text-slate-500 mb-7">
          เข้าสู่ระบบสำหรับเจ้าหน้าที่
        </p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="label">อีเมล</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="label">รหัสผ่าน</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </main>
  );
}
