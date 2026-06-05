export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  createdTime: string;
};

export type DriveCacheRow = {
  drive_id: string;
  name: string;
  mime_type: string;
  file_size: string | null;
  thumbnail_link: string | null;
  folder_name: string;
};

export type DriveFileType = "video" | "image" | "audio" | "other";

export function getDriveFileType(mimeType: string): DriveFileType {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return "other";
}

export function getDrivePreviewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function getDriveDownloadUrl(fileId: string) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function getDriveThumbnailUrl(fileId: string) {
  return `/api/drive-thumb?id=${fileId}`;
}

export function formatDriveSize(bytes?: string): string {
  if (!bytes) return "—";
  const n = parseInt(bytes, 10);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  return `${(n / 1e3).toFixed(0)} KB`;
}

export async function fetchDriveFolder(folderId: string): Promise<DriveFile[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  if (!apiKey || !folderId) return [];

  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id,name,mimeType,size,thumbnailLink,hasThumbnail,createdTime)",
    key: apiKey,
    pageSize: "1000",
    orderBy: "name",
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.files ?? [];
  } catch {
    return [];
  }
}
