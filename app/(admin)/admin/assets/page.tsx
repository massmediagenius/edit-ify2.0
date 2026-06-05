"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Upload, File, Image, Film, Music, Trash2, Download, Search, Grid3X3, List, Plus, FolderOpen, Settings, Check, ExternalLink, Play, X } from "lucide-react";
import { useToast, Toaster } from "@/app/(admin)/_components/Toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  getDriveFileType, getDrivePreviewUrl,
  getDriveDownloadUrl, formatDriveSize, type DriveFileType, type DriveCacheRow,
} from "@/lib/google-drive";

type AssetType = "video" | "image" | "audio" | "other";
type ViewMode = "grid" | "list";

type Asset = {
  id: string;
  name: string;
  file_type: AssetType;
  file_size: number | null;
  folder: string;
  uploaded_at: string;
  file_url: string;
};

type UnifiedFile = {
  uid: string;
  name: string;
  fileType: DriveFileType;
  size: string;
  folder: string;
  source: "drive" | "supabase";
  // drive
  driveId?: string;
  thumbnailLink?: string;
  // supabase
  assetId?: string;
  fileUrl?: string;
};

// ── Thumbnail ────────────────────────────────────────────────────────────────
function AdminThumb({ file, onPreview, onDownload, onDelete, selected, onSelect }: {
  file: UnifiedFile;
  onPreview: () => void;
  onDownload: () => void;
  onDelete?: () => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const Icon = TYPE_ICONS[file.fileType] ?? File;

  const thumbSrc = file.source === "drive" && file.thumbnailLink
    ? `/api/drive-thumb?url=${encodeURIComponent(file.thumbnailLink)}&id=${file.driveId}`
    : null;

  function renderMedia() {
    if (thumbSrc && !imgFailed) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbSrc} alt={file.name} className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
      );
    }
    if (file.source === "supabase" && file.fileType === "video" && file.fileUrl) {
      return (
        <video src={file.fileUrl} className="w-full h-full object-cover" muted playsInline preload="metadata"
          onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }} />
      );
    }
    if (file.source === "supabase" && file.fileType === "image" && file.fileUrl && !imgFailed) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.fileUrl} alt={file.name} className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
      );
    }
    return (
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", TYPE_COLORS[file.fileType])}>
        <Icon className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div
      onClick={() => { if (onSelect) onSelect(); else onPreview(); }}
      className={cn("group bg-surface border rounded-xl overflow-hidden cursor-pointer transition-all duration-200",
        selected ? "border-accent-orange ring-1 ring-accent-orange" : "border-border hover:border-accent-orange/30")}
    >
      <div className="h-24 bg-surface-raised flex items-center justify-center relative overflow-hidden">
        {renderMedia()}
        {file.fileType === "video" && (
          <div className="absolute bottom-2 left-2 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center pointer-events-none">
            <Play className="w-2.5 h-2.5 text-white ml-0.5" />
          </div>
        )}
        <span className={cn("absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
          file.source === "drive" ? "bg-blue-500/20 text-blue-300" : "bg-accent-orange/20 text-accent-orange")}>
          {file.source === "drive" ? "Drive" : "Uploaded"}
        </span>
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="w-7 h-7 rounded-lg bg-surface/80 border border-border flex items-center justify-center hover:bg-accent-cyan hover:border-accent-cyan hover:text-background transition-colors">
            <Play className="w-3 h-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="w-7 h-7 rounded-lg bg-surface/80 border border-border flex items-center justify-center hover:bg-accent-cyan hover:border-accent-cyan hover:text-background transition-colors">
            <Download className="w-3 h-3" />
          </button>
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 rounded-lg bg-surface/80 border border-border flex items-center justify-center hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-text-primary text-xs font-medium truncate">{file.name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", TYPE_COLORS[file.fileType])}>{file.fileType.toUpperCase()}</span>
          <span className="text-text-muted text-xs">{file.size}</span>
        </div>
      </div>
    </div>
  );
}

// ── Preview modal ─────────────────────────────────────────────────────────────
function AdminPreviewModal({ file, onClose }: { file: UnifiedFile; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  const downloadUrl = file.source === "drive" && file.driveId
    ? getDriveDownloadUrl(file.driveId) : file.fileUrl ?? "#";
  const previewSrc = file.source === "drive" && file.driveId
    ? getDrivePreviewUrl(file.driveId) : file.fileUrl;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-text-primary font-medium text-sm truncate max-w-md">{file.name}</p>
            <p className="text-text-muted text-xs mt-0.5">{file.folder} · {file.size}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-cyan text-background text-xs font-semibold rounded-lg hover:bg-accent-cyan/90 transition-colors">
              <Download className="w-3.5 h-3.5" /> Download
            </a>
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
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent-cyan text-sm hover:underline">
                <ExternalLink className="w-4 h-4" /> Open file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CONTENT_FOLDERS = ["Talking Videos", "B-roll", "Podcast", "Raw", "Private jet", "Las Vegas w/Steve", "Old Pics of David"];
const EDITING_FOLDERS = ["FONTS", "Stock Visuals", "BG Music", "Black screen overlays"];
const FOLDERS = ["All Assets", ...CONTENT_FOLDERS, ...EDITING_FOLDERS];
const TYPE_ICONS: Record<AssetType, React.ElementType> = { video: Film, image: Image, audio: Music, other: File };
const TYPE_COLORS: Record<AssetType, string> = {
  video: "text-accent-purple bg-accent-purple/10",
  image: "text-accent-cyan bg-accent-cyan/10",
  audio: "text-accent-green bg-accent-green/10",
  other: "text-text-muted bg-surface",
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function detectType(name: string): AssetType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["mp3", "wav", "aac", "ogg", "flac"].includes(ext)) return "audio";
  return "other";
}

const DRIVE_FOLDERS = ["Talking Videos", "B-roll", "Podcast", "Raw", "Private jet", "Las Vegas w/Steve", "Old Pics of David"];

function SyncButton({ onSynced }: { onSynced: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState("");

  async function handleSync() {
    setSyncing(true);
    setResult("");
    try {
      const res = await fetch("/api/sync-drive", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult(`Synced ${data.synced} files`);
        onSynced();
      } else {
        setResult(data.error ?? "Sync failed");
      }
    } catch {
      setResult("Sync failed");
    }
    setSyncing(false);
    setTimeout(() => setResult(""), 4000);
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-xs text-accent-green">{result}</span>}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-1.5 px-3 py-2 bg-surface-raised border border-border text-text-secondary rounded-lg text-xs font-medium hover:border-accent-cyan hover:text-accent-cyan transition-colors disabled:opacity-50"
      >
        <svg className={cn("w-3.5 h-3.5", syncing && "animate-spin")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        {syncing ? "Syncing…" : "Sync Drive"}
      </button>
    </div>
  );
}

function DriveFolderConfig() {
  const [folderIds, setFolderIds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase.from("drive_folders").select("folder_name, drive_folder_id");
      if (error) {
        setLoadError(`Could not load folder config: ${error.message}. Make sure you ran fix-drive-folders.sql in Supabase.`);
        return;
      }
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: { folder_name: string; drive_folder_id: string | null }) => {
        map[r.folder_name] = r.drive_folder_id ?? "";
      });
      setFolderIds(map);
    }
    load();
  }, []);

  async function save(folderName: string) {
    setSaving(folderName);
    setErrors((p) => ({ ...p, [folderName]: "" }));
    const supabase = createClient();
    const { error } = await supabase.from("drive_folders").upsert(
      { folder_name: folderName, drive_folder_id: folderIds[folderName] ?? null, updated_at: new Date().toISOString() },
      { onConflict: "folder_name" }
    );
    setSaving(null);
    if (error) {
      setErrors((p) => ({ ...p, [folderName]: error.message }));
      return;
    }
    setSaved(folderName);
    setTimeout(() => setSaved(null), 2000);
  }

  function extractFolderId(input: string): string {
    // Accept raw folder ID or full Drive URL
    const match = input.match(/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : input;
  }

  return (
    <div className="mb-6 bg-surface border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-raised transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Settings className="w-4 h-4 text-accent-orange" />
          Configure Google Drive Folders
        </div>
        <span className="text-xs text-text-muted">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4 space-y-3">
          {loadError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400">
              {loadError}
            </div>
          )}
          <p className="text-xs text-text-muted mb-4">
            Paste the Google Drive folder ID or full folder URL for each folder. Editors will see and download files directly from Drive.{" "}
            <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline inline-flex items-center gap-0.5">
              Open Drive <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          {DRIVE_FOLDERS.map((name) => (
            <div key={name} className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-36 shrink-0">
                  <FolderOpen className="w-4 h-4 text-accent-orange shrink-0" />
                  <span className="text-sm text-text-secondary">{name}</span>
                </div>
                <input
                  value={folderIds[name] ?? ""}
                  onChange={(e) => setFolderIds((p) => ({ ...p, [name]: extractFolderId(e.target.value) }))}
                  placeholder="Folder ID or Drive URL"
                  className={cn(
                    "flex-1 bg-surface-raised border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none font-mono text-xs",
                    errors[name] ? "border-red-500/50 focus:border-red-500" : "border-border focus:border-accent-orange/50"
                  )}
                />
                <button
                  onClick={() => save(name)}
                  disabled={saving === name}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-orange text-background text-xs font-semibold hover:bg-accent-orange/90 transition-colors disabled:opacity-50 shrink-0"
                >
                  {saved === name ? <><Check className="w-3 h-3" /> Saved</> : saving === name ? "Saving…" : "Save"}
                </button>
              </div>
              {errors[name] && (
                <p className="text-xs text-red-400 pl-[152px]">{errors[name]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [unifiedFiles, setUnifiedFiles] = useState<UnifiedFile[]>([]);
  const [activeFolder, setActiveFolder] = useState("All Assets");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, name: "" });
  const [uploadFolder, setUploadFolder] = useState("Talking Videos");
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<UnifiedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, toast } = useToast();

  const load = useCallback(async () => {
    const supabase = createClient();
    const unified: UnifiedFile[] = [];

    // Supabase uploads
    const { data } = await supabase.from("assets").select("*").order("uploaded_at", { ascending: false });
    const sbAssets = (data as unknown as Asset[]) ?? [];
    setAssets(sbAssets);
    sbAssets.forEach((a) => {
      unified.push({
        uid: `sb-${a.id}`, name: a.name,
        fileType: (a.file_type as DriveFileType) ?? "other",
        size: formatSize(a.file_size), folder: a.folder,
        source: "supabase", assetId: a.id, fileUrl: a.file_url,
      });
    });

    // Drive files — read from cache, no API call
    const { data: driveCache } = await supabase
      .from("drive_files_cache")
      .select("drive_id, name, mime_type, file_size, thumbnail_link, folder_name")
      .order("name");

    (driveCache as DriveCacheRow[] ?? []).forEach((f) => {
      unified.push({
        uid: `drive-${f.drive_id}`, name: f.name,
        fileType: getDriveFileType(f.mime_type),
        size: formatDriveSize(f.file_size ?? undefined),
        folder: f.folder_name, source: "drive" as const,
        driveId: f.drive_id, thumbnailLink: f.thumbnail_link ?? undefined,
      });
    });

    setUnifiedFiles(unified);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = unifiedFiles.filter((f) => {
    const matchFolder = activeFolder === "All Assets" || f.folder === activeFolder;
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const fileList = Array.from(files);
    setUploadProgress({ current: 0, total: fileList.length, name: "" });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let successCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadProgress({ current: i + 1, total: fileList.length, name: file.name });

      const path = `${uploadFolder}/${Date.now()}-${file.name}`;

      const { error: storageErr } = await supabase.storage.from("assets").upload(path, file, { upsert: false });
      if (storageErr) {
        toast(`Failed to upload "${file.name}": ${storageErr.message}`, "error");
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(path);

      const { error: dbErr } = await supabase.from("assets").insert({
        name: file.name,
        folder: uploadFolder,
        file_url: publicUrl,
        file_type: detectType(file.name),
        file_size: file.size,
        uploaded_by: user?.id,
      });

      if (dbErr) {
        toast(`Uploaded file but failed to save record: ${dbErr.message}`, "error");
        continue;
      }

      successCount++;
    }

    if (successCount > 0) {
      toast(`${successCount} file${successCount > 1 ? "s" : ""} uploaded to ${uploadFolder}.`, "success");
    }
    setUploading(false);
    setUploadProgress({ current: 0, total: 0, name: "" });
    load();
  }

  async function handleDownload(asset: Asset) {
    const supabase = createClient();
    const storagePath = asset.file_url.split("/storage/v1/object/public/assets/").pop();
    if (storagePath) {
      const { data } = await supabase.storage.from("assets").createSignedUrl(storagePath, 60);
      if (data?.signedUrl) {
        const a = document.createElement("a"); a.href = data.signedUrl; a.download = asset.name; a.click();
        return;
      }
    }
    const a = document.createElement("a"); a.href = asset.file_url; a.download = asset.name; a.click();
  }

  async function handleDelete(ids: string[]) {
    const supabase = createClient();
    for (const id of ids) {
      const asset = assets.find((a) => a.id === id);
      if (!asset) continue;
      const storagePath = asset.file_url.split("/storage/v1/object/public/assets/").pop();
      if (storagePath) await supabase.storage.from("assets").remove([storagePath]);
      await supabase.from("assets").delete().eq("id", id);
    }
    setAssets((prev) => prev.filter((a) => !ids.includes(a.id)));
    setSelected(new Set());
    toast(`${ids.length} file${ids.length > 1 ? "s" : ""} deleted.`, "success");
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  const folderCounts: Record<string, number> = { "All Assets": unifiedFiles.length };
  [...CONTENT_FOLDERS, ...EDITING_FOLDERS].forEach((f) => { folderCounts[f] = unifiedFiles.filter((u) => u.folder === f).length; });

  async function downloadFile(file: UnifiedFile) {
    if (file.source === "drive" && file.driveId) {
      window.open(getDriveDownloadUrl(file.driveId), "_blank");
      return;
    }
    if (file.fileUrl && file.assetId) {
      const asset = assets.find((a) => a.id === file.assetId);
      if (asset) await handleDownload(asset);
    }
  }

  async function deleteFile(file: UnifiedFile) {
    if (file.source === "supabase" && file.assetId) {
      await handleDelete([file.assetId]);
      setUnifiedFiles((prev) => prev.filter((f) => f.uid !== file.uid));
    }
  }

  return (
    <>
      {previewFile && <AdminPreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      <div className="flex flex-col h-full">
      {/* Drive folder config */}
      <div className="px-6 pt-6">
        <DriveFolderConfig />
      </div>

      <div className="flex flex-1 min-h-0">
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
        <div>
          {/* All Assets */}
          <button onClick={() => setActiveFolder("All Assets")}
            className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors mb-3",
              activeFolder === "All Assets" ? "bg-accent-orange/10 text-accent-orange" : "text-text-secondary hover:bg-surface-raised hover:text-text-primary")}>
            <span>All Assets</span>
            <span className="text-xs text-text-muted">{folderCounts["All Assets"] ?? 0}</span>
          </button>

          {/* Content Folders */}
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Content Folders</p>
          {CONTENT_FOLDERS.map((folder) => (
            <button key={folder} onClick={() => { setActiveFolder(folder); setUploadFolder(folder); }}
              className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
                activeFolder === folder ? "bg-accent-orange/10 text-accent-orange" : "text-text-secondary hover:bg-surface-raised hover:text-text-primary")}>
              <span className="truncate">{folder}</span>
              <span className="text-xs text-text-muted shrink-0 ml-1">{folderCounts[folder] ?? 0}</span>
            </button>
          ))}

          {/* Editing Assets */}
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 mt-4">Editing Assets</p>
          {EDITING_FOLDERS.map((folder) => (
            <button key={folder} onClick={() => { setActiveFolder(folder); setUploadFolder(folder); }}
              className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
                activeFolder === folder ? "bg-accent-purple/10 text-accent-purple" : "text-text-secondary hover:bg-surface-raised hover:text-text-primary")}>
              <span className="truncate">{folder}</span>
              <span className="text-xs text-text-muted shrink-0 ml-1">{folderCounts[folder] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Upload folder selector */}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Uploading to: <span className="text-accent-orange normal-case">{uploadFolder}</span>
          </p>
          <select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)}
            className="w-full bg-surface-raised border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-orange">
            <optgroup label="Content Folders">
              {CONTENT_FOLDERS.map((f) => <option key={f} value={f}>{f}</option>)}
            </optgroup>
            <optgroup label="Editing Assets">
              {EDITING_FOLDERS.map((f) => <option key={f} value={f}>{f}</option>)}
            </optgroup>
          </select>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg bg-accent-orange text-background text-xs font-semibold hover:bg-accent-orange/90 transition-colors disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" />
            {uploading ? "Uploading…" : "Upload Files"}
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="font-heading text-xl font-bold text-text-primary flex-1">{activeFolder}</h1>
          <SyncButton onSynced={load} />
          {selected.size > 0 && (
            <button onClick={() => handleDelete(Array.from(selected))}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
              <Trash2 className="w-4 h-4" /> Delete ({selected.size})
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files…"
              className="bg-surface-raised border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50 w-48" />
          </div>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={cn("p-2 transition-colors", viewMode === "grid" ? "bg-surface-raised text-text-primary" : "text-text-muted hover:text-text-secondary")}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("list")} className={cn("p-2 transition-colors", viewMode === "list" ? "bg-surface-raised text-text-primary" : "text-text-muted hover:text-text-secondary")}><List className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Upload progress banner */}
        {uploading && (
          <div className="mb-4 bg-accent-orange/10 border border-accent-orange/30 rounded-xl px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-accent-orange">
                Uploading {uploadProgress.current} of {uploadProgress.total}…
              </span>
              <span className="text-xs text-text-muted truncate max-w-xs">{uploadProgress.name}</span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-orange rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Drop zone banner when dragging */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          className={cn("border-2 border-dashed rounded-xl p-6 text-center mb-6 transition-all duration-200 cursor-pointer",
            dragOver ? "border-accent-orange bg-accent-orange/5 text-accent-orange" : "border-border text-text-muted hover:border-text-muted")}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-6 h-6 mx-auto mb-1" />
          <p className="text-sm">{dragOver ? "Drop to upload" : "Drag & drop files here, or click to browse"}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-4">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-36 bg-surface-raised border border-border rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-text-muted">No files found.</div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((file) => (
              <AdminThumb
                key={file.uid}
                file={file}
                onPreview={() => setPreviewFile(file)}
                onDownload={() => downloadFile(file)}
                onDelete={file.source === "supabase" ? () => deleteFile(file) : undefined}
                selected={file.source === "supabase" && file.assetId ? selected.has(file.assetId) : false}
                onSelect={file.source === "supabase" && file.assetId ? () => toggleSelect(file.assetId!) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-border">{["", "Name", "Type", "Size", "Folder", "Source", ""].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((file) => {
                  const Icon = TYPE_ICONS[file.fileType] ?? File;
                  return (
                    <tr key={file.uid} className="border-b border-border/50 last:border-0 hover:bg-surface-raised transition-colors cursor-pointer" onClick={() => setPreviewFile(file)}>
                      <td className="px-4 py-3 w-10">
                        {file.source === "supabase" && file.assetId && (
                          <input type="checkbox" checked={selected.has(file.assetId)} onChange={(e) => { e.stopPropagation(); toggleSelect(file.assetId!); }} className="rounded border-border" />
                        )}
                      </td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", TYPE_COLORS[file.fileType])}><Icon className="w-3.5 h-3.5" /></div><span className="text-sm text-text-primary">{file.name}</span></div></td>
                      <td className="px-4 py-3"><span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", TYPE_COLORS[file.fileType])}>{file.fileType.toUpperCase()}</span></td>
                      <td className="px-4 py-3 text-sm text-text-muted">{file.size}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{file.folder}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-bold",
                          file.source === "drive" ? "bg-blue-500/20 text-blue-300" : "bg-accent-orange/20 text-accent-orange")}>
                          {file.source === "drive" ? "Drive" : "Uploaded"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => downloadFile(file)} className="text-text-muted hover:text-accent-cyan transition-colors"><Download className="w-4 h-4" /></button>
                          {file.source === "supabase" && (
                            <button onClick={() => deleteFile(file)} className="text-text-muted hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toaster toasts={toasts} />
      </div>
    </div>
    </>
  );
}
