"use client";

import { useState, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  apiToken?: string;
  endpoint?: string; // /api/uploads/rooms (default) or /api/uploads/slips
  multiple?: boolean;
}

export default function ImageUploader({
  value,
  onChange,
  apiToken,
  endpoint = "/api/uploads/rooms",
  multiple = true,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch(`${API}${endpoint}`, {
          method: "POST",
          headers: apiToken ? { authorization: `Bearer ${apiToken}` } : {},
          body: fd,
        });
        if (!r.ok) {
          const t = await r.text();
          throw new Error(t || `Upload failed (${r.status})`);
        }
        const data = await r.json();
        uploaded.push(data.url);
      }
      onChange([...value, ...uploaded]);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
          {value.map((url, i) => (
            <div
              key={url + i}
              className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-slate-200"
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1.5 right-1.5 bg-black/60 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        className={
          "block cursor-pointer border-2 border-dashed rounded-lg p-6 text-center transition-colors " +
          (uploading
            ? "border-slate-300 bg-slate-50"
            : "border-slate-300 hover:border-brand-600 hover:bg-brand-50/30")
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
        <div className="text-3xl mb-2">📷</div>
        <div className="text-sm font-medium text-slate-700">
          {uploading
            ? "กำลังอัปโหลด..."
            : "คลิกเพื่อเลือกรูปภาพ"}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          JPG, PNG, WebP, GIF — สูงสุด 5MB ต่อไฟล์
        </div>
      </label>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
