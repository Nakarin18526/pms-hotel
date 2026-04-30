"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Admin {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "STAFF";
  createdAt: string;
}

export default function AdminsClient({
  initialAdmins,
  currentAdminId,
}: {
  initialAdmins: Admin[];
  currentAdminId: string;
}) {
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;
  const router = useRouter();

  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "STAFF">("STAFF");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(
    null,
  );

  function showMsg(kind: "success" | "error", text: string) {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function refresh() {
    try {
      const r = await fetch(`${API}/api/admin/admins`, {
        headers: { authorization: `Bearer ${apiToken}` },
      });
      if (r.ok) setAdmins(await r.json());
      router.refresh();
    } catch {}
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMsg(null);
    try {
      const r = await fetch(`${API}/api/admin/admins`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ email, name, password, role }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message ?? (await r.text()));
      }
      showMsg("success", `✓ สร้าง admin ${email} เรียบร้อย`);
      setName("");
      setEmail("");
      setPassword("");
      setRole("STAFF");
      await refresh();
    } catch (e: any) {
      showMsg("error", e.message);
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(
    a: Admin,
    nextRole: "SUPER_ADMIN" | "STAFF",
  ) {
    if (nextRole === a.role) return;
    try {
      const r = await fetch(`${API}/api/admin/admins/${a.id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message ?? (await r.text()));
      }
      showMsg("success", `✓ เปลี่ยน role ของ ${a.email} → ${nextRole}`);
      await refresh();
    } catch (e: any) {
      showMsg("error", e.message);
    }
  }

  async function resetPassword(a: Admin) {
    const np = prompt(`ตั้งรหัสผ่านใหม่สำหรับ ${a.email} (อย่างน้อย 8 ตัว)`);
    if (!np) return;
    try {
      const r = await fetch(`${API}/api/admin/admins/${a.id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ password: np }),
      });
      if (!r.ok) throw new Error(await r.text());
      showMsg("success", `✓ เปลี่ยนรหัสผ่านของ ${a.email} เรียบร้อย`);
    } catch (e: any) {
      showMsg("error", e.message);
    }
  }

  async function remove(a: Admin) {
    if (!confirm(`ลบ admin ${a.email}?`)) return;
    try {
      const r = await fetch(`${API}/api/admin/admins/${a.id}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${apiToken}` },
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message ?? (await r.text()));
      }
      showMsg("success", `✓ ลบ ${a.email} แล้ว`);
      await refresh();
    } catch (e: any) {
      showMsg("error", e.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="card p-6">
        <h2 className="font-serif text-xl mb-4">+ สร้าง Admin ใหม่</h2>
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">ชื่อ</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="label">อีเมล</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="staff@example.com"
            />
          </div>
          <div>
            <label className="label">รหัสผ่าน (อย่างน้อย 8 ตัว)</label>
            <input
              type="text"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input num"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="label">สิทธิ์</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="input"
            >
              <option value="STAFF">STAFF — เฉพาะ Bookings + Calendar</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN — จัดการได้ทุกอย่าง</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary" disabled={creating}>
              {creating ? "กำลังสร้าง…" : "สร้าง Admin"}
            </button>
          </div>
        </form>
      </div>

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

      {/* List */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr className="text-left">
              <th className="p-3">Admin</th>
              <th className="p-3">Role</th>
              <th className="p-3">Created</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const isMe = a.id === currentAdminId;
              return (
                <tr key={a.id} className="border-t hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-medium flex items-center gap-2">
                      {a.name}
                      {isMe && (
                        <span className="badge bg-gold-50 text-gold-800 ring-1 ring-gold-600/20">
                          you
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{a.email}</div>
                  </td>
                  <td className="p-3">
                    <select
                      value={a.role}
                      disabled={isMe}
                      onChange={(e) =>
                        changeRole(a, e.target.value as any)
                      }
                      className={
                        "px-2 py-1 rounded border text-xs " +
                        (a.role === "SUPER_ADMIN"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "border-amber-300 bg-amber-50 text-amber-800") +
                        (isMe ? " opacity-50 cursor-not-allowed" : "")
                      }
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="STAFF">STAFF</option>
                    </select>
                  </td>
                  <td className="p-3 text-xs text-slate-500 num">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => resetPassword(a)}
                        className="text-xs text-brand-700 hover:text-brand-900 px-2 py-1 hover:bg-brand-50 rounded"
                      >
                        Reset password
                      </button>
                      {!isMe && (
                        <button
                          onClick={() => remove(a)}
                          className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {admins.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  ไม่มี admin ในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
