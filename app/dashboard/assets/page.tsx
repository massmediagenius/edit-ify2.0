"use client";

import { useEffect, useState } from "react";
import { Search, Download, Film, Image, Music, File, FolderOpen, X, Play, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { HelpTip } from "../_components/HelpTip";
import {
  getDriveFileType,
  getDrivePreviewUrl,
  getDriveDownloadUrl,
  formatDriveSize,
  type DriveFileType,
  type DriveCacheRow,
} from "@/lib/google-drive";

const CONTENT_FOLDERS = ["Talking Videos", "B-roll", "Podcast", "Raw", "Private jet", "Las Vegas w/Steve", "Old Pics of David"];
const EDITING_FOLDERS = ["FONTS", "Stock Visuals", "BG Music", "Black screen overlays"];

// Unified file type covering both Drive and Supabase sources
type UnifiedFile = {
  id: string;
  name: string;
  fileType: DriveFileType;
  size?: string;
  folder: string;
  source: "drive" | "supabase";
  // Drive-specific
  driveId?: string;
  thumbnailLink?: string;
  // Supabase-specific
  fileUrl?: string;
};

const TYPE_ICON: Record<DriveFileType, React.ElementType> = {
  video: Film, image: Image, audio: Music, other: File,
};
const TYPE_COLORS: Record<DriveFileType, string> = {
  video: "text-accent-purple bg-accent-purple/10",
  image: "text-accent-cyan bg-accent-cyan/10",
  audio: "text-accent-green bg-accent-green/10",
  other: "text-text-muted bg-surface",
};

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "—";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

async function forceDownload(url: string, fileName: string, isDrive: boolean) {
  if (isDrive) { window.open(url, "_blank"); return; }
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank");
  }
}

// ── Thumbnail component ──────────────────────────────────────────────────────
function Thumb({ file, Icon }: { file: UnifiedFile; Icon: React.ElementType }) {
  const [imgFailed, setImgFailed] = useState(false);

  // Only attempt a thumbnail if Drive gave us a thumbnailLink — otherwise show icon
  const driveThumbSrc = file.source === "drive" && file.driveId && file.thumbnailLink
    ? `/api/drive-thumb?url=${encodeURIComponent(file.thumbnailLink)}&id=${file.driveId}`
    : null;

  const downloadUrl = file.source === "drive" && file.driveId
    ? getDriveDownloadUrl(file.driveId)
    : file.fileUrl ?? "#";

  function renderMedia() {
    // Drive files — use thumbnail image
    if (file.source === "drive" && driveThumbSrc && !imgFailed) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={driveThumbSrc}
          alt={file.name}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      );
    }
    // Supabase video — use <video> to render first frame
    if (file.source === "supabase" && file.fileType === "video" && file.fileUrl) {
      return (
        <video
          src={file.fileUrl}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            (e.target as HTMLVideoElement).currentTime = 1;
          }}
        />
      );
    }
    // Supabase image
    if (file.source === "supabase" && file.fileType === "image" && file.fileUrl && !imgFailed) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.fileUrl}
          alt={file.name}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      );
    }
    // Fallback icon
    return (
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", TYPE_COLORS[file.fileType])}>
        <Icon className="w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="h-28 bg-surface-raised flex items-center justify-center relative overflow-hidden">
      {renderMedia()}

      {/* Play badge for videos */}
      {file.fileType === "video" && (
        <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center pointer-events-none">
          <Play className="w-3 h-3 text-white ml-0.5" />
        </div>
      )}

      {/* Source badge */}
      <span className={cn(
        "absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
        file.source === "drive" ? "bg-blue-500/20 text-blue-300" : "bg-accent-orange/20 text-accent-orange"
      )}>
        {file.source === "drive" ? "Drive" : "Uploaded"}
      </span>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-4 h-4 text-white ml-0.5" />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); forceDownload(downloadUrl, file.name, file.source === "drive"); }}
          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-accent-cyan/60 transition-colors"
        >
          <Download className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Preview modal ─────────────────────────────────────────────────────────────
function PreviewModal({ file, onClose }: { file: UnifiedFile; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  const downloadUrl = file.source === "drive" && file.driveId
    ? getDriveDownloadUrl(file.driveId)
    : file.fileUrl ?? "#";

  const previewSrc = file.source === "drive" && file.driveId
    ? getDrivePreviewUrl(file.driveId)
    : file.fileUrl;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-text-primary font-medium text-sm truncate max-w-md">{file.name}</p>
            <p className="text-text-muted text-xs mt-0.5">{file.folder} · {file.size ?? "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => forceDownload(downloadUrl, file.name, file.source === "drive")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-cyan text-background text-xs font-semibold rounded-lg hover:bg-accent-cyan/90 transition-colors">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-raised flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>
        <div className="bg-black">
          {previewSrc && (file.fileType === "video" || file.fileType === "image" || file.fileType === "audio") ? (
            file.source === "drive" ? (
              <iframe src={previewSrc} className="w-full" style={{ height: "480px", border: "none" }} allow="autoplay" title={file.name} />
            ) : file.fileType === "video" ? (
              <video controls src={previewSrc} className="w-full max-h-[480px]" />
            ) : file.fileType === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewSrc} alt={file.name} className="w-full max-h-[480px] object-contain" />
            ) : (
              <audio controls src={previewSrc} className="w-full p-4" />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <File className="w-12 h-12 text-text-muted" />
              <button
                onClick={() => forceDownload(downloadUrl, file.name, file.source === "drive")}
                className="flex items-center gap-2 text-accent-cyan text-sm hover:underline"
              >
                <ExternalLink className="w-4 h-4" /> Download file
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20; // 4 columns × 5 rows

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AssetsPage() {
  const [files, setFiles] = useState<UnifiedFile[]>([]);
  const [activeFolder, setActiveFolder] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<UnifiedFile | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const unified: UnifiedFile[] = [];

      // 1. Fetch Supabase-uploaded assets
      const { data: supabaseAssets } = await supabase
        .from("assets")
        .select("id, name, folder, file_url, file_type, file_size")
        .order("uploaded_at", { ascending: false });

      (supabaseAssets ?? []).forEach((a: {
        id: string; name: string; folder: string; file_url: string;
        file_type: string | null; file_size: number | null;
      }) => {
        unified.push({
          id: `sb-${a.id}`,
          name: a.name,
          fileType: (a.file_type as DriveFileType) ?? "other",
          size: formatBytes(a.file_size),
          folder: a.folder,
          source: "supabase",
          fileUrl: a.file_url,
        });
      });

      // 2. Read Drive files from cache — no API call on every load
      const { data: driveCache } = await supabase
        .from("drive_files_cache")
        .select("drive_id, name, mime_type, file_size, thumbnail_link, folder_name")
        .order("name");

      (driveCache as DriveCacheRow[] ?? []).forEach((f) => {
        unified.push({
          id: `drive-${f.drive_id}`,
          name: f.name,
          fileType: getDriveFileType(f.mime_type),
          size: formatDriveSize(f.file_size ?? undefined),
          folder: f.folder_name,
          source: "drive" as const,
          driveId: f.drive_id,
          thumbnailLink: f.thumbnail_link ?? undefined,
        });
      });

      setFiles(unified);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = files.filter((f) => {
    const matchFolder = activeFolder === "All" || f.folder === activeFolder;
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const folderCounts: Record<string, number> = { All: files.length };
  [...CONTENT_FOLDERS, ...EDITING_FOLDERS].forEach((name) => {
    folderCounts[name] = files.filter((f) => f.folder === name).length;
  });

  return (
    <>
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 border-r border-border p-4 overflow-y-auto">
          {/* All */}
          <button
            onClick={() => { setActiveFolder("All"); setPage(1); }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors mb-3",
              activeFolder === "All"
                ? "bg-accent-cyan/10 text-accent-cyan"
                : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <FolderOpen className="w-4 h-4 shrink-0" />
              <span className="truncate">All</span>
            </span>
            <span className="text-xs text-text-muted shrink-0 ml-1">{folderCounts["All"] ?? 0}</span>
          </button>

          {/* Content Folders */}
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Content Folders</p>
            <HelpTip side="right" width="w-72" content="David's raw footage organized by shoot type. Use these as your source material for edits. Talking Videos = on-camera, B-roll = lifestyle cutaways, Podcast = interview clips, Raw = unedited footage, Old Pics = throwback photos for Glow Up edits." />
          </div>
          {CONTENT_FOLDERS.map((folder) => (
            <button
              key={folder}
              onClick={() => { setActiveFolder(folder); setPage(1); }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors mb-1",
                activeFolder === folder
                  ? "bg-accent-cyan/10 text-accent-cyan"
                  : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <FolderOpen className="w-4 h-4 shrink-0" />
                <span className="truncate">{folder}</span>
              </span>
              <span className="text-xs text-text-muted shrink-0 ml-1">{folderCounts[folder] ?? 0}</span>
            </button>
          ))}

          {/* Editing Assets */}
          <div className="flex items-center gap-1.5 mb-2 mt-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Editing Assets</p>
            <HelpTip side="right" width="w-72" content="Tools and resources to finish polished edits. FONTS = brand typefaces for text overlays, Stock Visuals = extra footage & graphics, BG Music = cleared background tracks, Black Screen Overlays = transitions and cinematic effects. Download anything with one click." />
          </div>
          {EDITING_FOLDERS.map((folder) => (
            <button
              key={folder}
              onClick={() => { setActiveFolder(folder); setPage(1); }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors mb-1",
                activeFolder === folder
                  ? "bg-accent-purple/10 text-accent-purple"
                  : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <FolderOpen className="w-4 h-4 shrink-0" />
                <span className="truncate">{folder}</span>
              </span>
              <span className="text-xs text-text-muted shrink-0 ml-1">{folderCounts[folder] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="font-heading text-xl font-bold text-text-primary flex-1">
              {activeFolder === "All" ? "All Assets" : activeFolder}
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search files…"
                className="bg-surface-raised border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 w-52"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-40 bg-surface-raised border border-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-text-muted">No files in this folder yet.</div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4">
                {paginated.map((file) => {
                  const Icon = TYPE_ICON[file.fileType];
                  return (
                    <div
                      key={file.id}
                      className="group bg-surface border border-border rounded-xl overflow-hidden hover:border-accent-cyan/30 transition-all duration-200 cursor-pointer"
                      onClick={() => setPreviewFile(file)}
                    >
                      <Thumb file={file} Icon={Icon} />
                      <div className="p-3">
                        <p className="text-text-primary text-xs font-medium truncate">{file.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", TYPE_COLORS[file.fileType])}>
                            {file.fileType.toUpperCase()}
                          </span>
                          <span className="text-text-muted text-xs">{file.size}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-text-muted">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} files
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-border hover:bg-surface-raised hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…" ? (
                          <span key={`ellipsis-${i}`} className="px-2 text-text-muted text-sm">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p as number)}
                            className={cn(
                              "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                              page === p
                                ? "bg-accent-cyan text-background"
                                : "text-text-secondary border border-border hover:bg-surface-raised hover:text-text-primary"
                            )}
                          >
                            {p}
                          </button>
                        )
                      )}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-border hover:bg-surface-raised hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
