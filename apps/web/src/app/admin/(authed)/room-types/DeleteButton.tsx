"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("ลบห้องนี้?")) return;
    setBusy(true);
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/room-types/${id}`,
      {
        method: "DELETE",
        headers: { authorization: `Bearer ${(session as any)?.apiToken}` },
      },
    );
    setBusy(false);
    router.refresh();
  }

  return (
    <button onClick={remove} disabled={busy} className="btn-danger text-sm">
      {busy ? "..." : "Delete"}
    </button>
  );
}
