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

// Downscale + re-encode an image so it's small enough to ride along inside a
// queued request body (IndexedDB / JSON) when uploaded offline.
async function fileToCompressedDataUrl(
  file: File,
  maxDim = 1280,
  quality = 0.6,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Upload each image now; if an upload fails (typically offline) keep the bytes
 * as a compressed data URL so the report request can carry them and the server
 * uploads them when the queued request finally runs.
 */
export async function uploadImagesWithFallback(
  files: File[],
  folder: string,
): Promise<{ fotos: string[]; pendientes: string[] }> {
  const fotos: string[] = [];
  const pendientes: string[] = [];
  for (const f of files) {
    try {
      fotos.push(await uploadImage(f, folder));
    } catch {
      try {
        pendientes.push(await fileToCompressedDataUrl(f));
      } catch {
        // Unreadable image — drop this one photo, keep the report.
      }
    }
  }
  return { fotos, pendientes };
}
