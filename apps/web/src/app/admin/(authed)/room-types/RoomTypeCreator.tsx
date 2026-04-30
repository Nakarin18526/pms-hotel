"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";

export default function RoomTypeCreator() {
  const router = useRouter();
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxOccupancy, setMaxOccupancy] = useState(2);
  const [totalUnits, setTotalUnits] = useState(1);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/room-types`,
        {
          method: "POST",
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
      setName("");
      setDescription("");
      setMaxOccupancy(2);
      setTotalUnits(1);
      setImageUrls([]);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-serif text-xl mb-4">+ New Room Type</h2>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input"
          />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input"
          />
        </div>
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
        <div className="col-span-2">
          <label className="label">Images</label>
          <ImageUploader
            value={imageUrls}
            onChange={setImageUrls}
            apiToken={apiToken}
          />
        </div>
        {error && (
          <div className="col-span-2 text-sm text-red-600">{error}</div>
        )}
        <div className="col-span-2">
          <button className="btn-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
