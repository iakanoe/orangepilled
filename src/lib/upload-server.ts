import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "media";

/**
 * Upload images that were captured offline and shipped inside the request as
 * data URLs. SERVER ONLY — uses the admin client to write to Storage. Returns
 * the public URLs of whatever uploaded successfully.
 */
export async function uploadDataUrls(
  admin: SupabaseClient,
  folder: string,
  dataUrls: string[],
): Promise<string[]> {
  const urls: string[] = [];
  for (const d of dataUrls) {
    const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(d);
    if (!match) continue;
    const contentType = match[1] || "image/jpeg";
    const bytes = match[2]
      ? Buffer.from(match[3], "base64")
      : Buffer.from(decodeURIComponent(match[3]), "utf-8");
    const ext = (contentType.split("/")[1] || "jpg").replace(/\+.*$/, "");
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    });
    if (error) continue;

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}
