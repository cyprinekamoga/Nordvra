"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { addPhotoAction } from "@/lib/admin/trust-actions";
import { PHOTO_BUCKET } from "@/lib/quote/photoUrl";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { selectClasses } from "./bits";

const TYPES: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Photo report upload on the booking page. The file goes straight from the browser to the
 * "fotorapporter" bucket with the admin's session (storage policies allow admins only), under a
 * random name; the server action then registers it on the booking.
 */
export function PhotoUploader({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const files = data.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    const kind = data.get("kind") === "fore" ? "fore" : "efter";
    const caption = String(data.get("caption") ?? "");
    if (files.length === 0) {
      setMessage("Välj minst en bild.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    let saved = 0;
    for (const file of files) {
      const ext = TYPES[file.type];
      if (!ext || file.size > MAX_BYTES) {
        setMessage(`${file.name}: bara JPG, PNG eller WebP upp till 10 MB.`);
        continue;
      }
      const path = `${bookingId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type });
      if (error) {
        setMessage(`${file.name} kunde inte laddas upp.`);
        continue;
      }
      const result = await addPhotoAction({ bookingId, path, kind, caption });
      if (result.ok) saved++;
      else setMessage(result.message ?? "Bilden kunde inte sparas.");
    }
    setBusy(false);
    if (saved > 0) {
      form.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="mb-1 block font-bold">Bilder</span>
        <input name="files" type="file" accept="image/jpeg,image/png,image/webp" multiple className={selectClasses} />
      </label>
      <label className="block">
        <span className="mb-1 block font-bold">Typ</span>
        <select name="kind" defaultValue="efter" className={selectClasses}>
          <option value="efter">Efter</option>
          <option value="fore">Före</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block font-bold">Bildtext (valfritt)</span>
        <input name="caption" maxLength={200} className={selectClasses} placeholder="T.ex. Köket efter städningen" />
      </label>
      <div className="sm:col-span-2">
        {message && (
          <p role="alert" className="mb-3 font-bold text-danger">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 rounded-control border-2 border-brand bg-brand px-5 font-semibold text-on-brand disabled:opacity-60"
        >
          {busy ? "Laddar upp …" : "Lägg till i fotorapporten"}
        </button>
        <p className="mt-2 text-sm text-muted">Kunden ser bilderna på sin bokningssida och i bostadens logg.</p>
      </div>
    </form>
  );
}
