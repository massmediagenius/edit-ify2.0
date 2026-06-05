import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get all configured Drive folder IDs
  const { data: folders } = await supabase
    .from("drive_folders")
    .select("folder_name, drive_folder_id")
    .eq("is_active", true)
    .not("drive_folder_id", "is", null);

  if (!folders || folders.length === 0) {
    return NextResponse.json({ synced: 0, message: "No Drive folders configured." });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  let totalSynced = 0;

  for (const folder of folders) {
    const params = new URLSearchParams({
      q: `'${folder.drive_folder_id}' in parents and trashed=false`,
      fields: "files(id,name,mimeType,size,thumbnailLink)",
      key: apiKey!,
      pageSize: "1000",
      orderBy: "name",
    });

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
      if (!res.ok) continue;
      const data = await res.json();
      const files: { id: string; name: string; mimeType: string; size?: string; thumbnailLink?: string }[] =
        data.files ?? [];

      const visible = files.filter((f) => !f.name.startsWith("."));
      if (visible.length === 0) continue;

      // Upsert all files for this folder
      const { error } = await supabase.from("drive_files_cache").upsert(
        visible.map((f) => ({
          drive_id: f.id,
          name: f.name,
          mime_type: f.mimeType,
          file_size: f.size ?? null,
          thumbnail_link: f.thumbnailLink ?? null,
          folder_name: folder.folder_name,
          synced_at: new Date().toISOString(),
        })),
        { onConflict: "drive_id" }
      );

      if (!error) totalSynced += visible.length;
    } catch {
      continue;
    }
  }

  // Remove stale entries (files that no longer exist in Drive)
  // We delete cache entries older than this sync run
  await supabase
    .from("drive_files_cache")
    .delete()
    .lt("synced_at", new Date(Date.now() - 5000).toISOString());

  return NextResponse.json({ synced: totalSynced, folders: folders.length });
}
