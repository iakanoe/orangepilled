import { createClient } from "@/lib/supabase/client";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "media";

/**
 * Upload one image to Supabase Storage (public bucket) and return its URL.
 * Runs in the browser with the user's session. Fails when offline — callers
 * should treat photos as best-effort and continue without them.
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  // No Date.now/random constraints here (browser) — build a unique-ish name.
  const rand = crypto.randomUUID();
  const path = `${folder}/${rand}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload several images; skips any that fail (best-effort). */
export async function uploadImages(
  files: File[],
  folder: string,
): Promise<string[]> {
  const urls: string[] = [];
  for (const f of files) {
    try {
      urls.push(await uploadImage(f, folder));
    } catch {
      // ignore individual failures (e.g. offline)
    }
  }
  return urls;
}
