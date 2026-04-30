"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";

export default function EditRoomTypeForm({ initial }: { initial: any }) {
  const router = useRouter();
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [maxOccupancy, setMaxOccupancy] = useState(initial.maxOccupancy);
  const [totalUnits, setTotalUnits] = useState(initial.totalUnits);
  const [imageUrls, setImageUrls] = useState<string[]>(initial.imageUrls ?? []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/room-types/${initial.id}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            name,
            description,
            maxOccupancy,
            totalUnits,
            imageUrls,
          }),
        },
      );
      if (!r.ok) throw new Error(await r.text());
      setMsg("✓ Saved");
      router.refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="input"
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Max Occupancy</label>
          <input
            type="number"
            value={maxOccupancy}
            onChange={(e) => setMaxOccupancy(Number(e.target.value))}
            min={1}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">Total Units</label>
          <input
            type="number"
            value={totalUnits}
            onChange={(e) => setTotalUnits(Number(e.target.value))}
            min={1}
            required
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label">Images</label>
        <ImageUploader
          value={imageUrls}
          onChange={setImageUrls}
          apiToken={apiToken}
        />
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={busy}>
          {busy ? "Saving..." : "Save"}
        </button>
        {msg && <span className="text-sm text-slate-600">{msg}</span>}
      </div>
    </form>
  );
}
