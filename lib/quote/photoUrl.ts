import { supabaseEnv } from "@/lib/supabase/env";

/** Bucket for photo reports (public; a photo is only reachable by its random path). */
export const PHOTO_BUCKET = "fotorapporter";

/** Public URL of a photo-report image, or null when Supabase isn't configured. */
export function photoUrl(path: string): string | null {
  const env = supabaseEnv();
  if (!env) return null;
  return `${env.url.replace(/\/$/, "")}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}
