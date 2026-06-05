"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, CheckCircle, DollarSign, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { HelpTip } from "../_components/HelpTip";

type ContentStyle = { id: string; name: string; price_per_edit: number; gradient_class: string };

export default function UploadPage() {
  const [styles, setStyles] = useState<ContentStyle[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadStyles() {
      const supabase = createClient();
      const { data } = await supabase.from("content_styles").select("id, name, price_per_edit, gradient_class").eq("is_active", true).order("level");
      setStyles(data ?? []);
    }
    loadStyles();
  }, []);

  const selectedStyle = styles.find((s) => s.id === selectedStyleId);

  function handleFileChange(f: File | null) {
    if (!f) return;
    setFile(f);
    setDone(false);
    setError("");
  }

  async function handleUpload() {
    if (!file || !selectedStyleId) {
      setError("Please select a content style and choose a file.");
      return;
    }
    setError("");
    setUploading(true);
    setProgress(10);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired. Please log in again."); setUploading(false); return; }

    // Upload file to Supabase Storage
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    setProgress(30);

    const { error: storageError } = await supabase.storage.from("submissions").upload(path, file, { upsert: false });
    if (storageError) { setError(storageError.message); setUploading(false); return; }
    setProgress(70);

    const { data: { publicUrl } } = supabase.storage.from("submissions").getPublicUrl(path);

    // Insert submission — DB trigger auto-creates earnings row + updates pending balance
    const { error: dbError } = await supabase.from("submissions").insert({
      editor_id: user.id,
      content_style_id: selectedStyleId,
      file_url: publicUrl || path,
      file_name: file.name,
      file_size: file.size,
    });

    if (dbError) { setError(dbError.message); setUploading(false); return; }
    setProgress(100);

    setTimeout(() => {
      setDone(true);
      setUploading(false);
      setFile(null);
      setSelectedStyleId("");
      setProgress(0);
    }, 500);
  }

  if (done) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-accent-green/20 border border-accent-green/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-accent-green" />
          </div>
          <h2 className="font-heading text-xl font-bold text-text-primary mb-2">Edit Submitted!</h2>
          <p className="text-text-secondary text-sm mb-1">
            Your edit has been sent for review. Once approved, the payment will move to your available balance.
          </p>
          {selectedStyle && (
            <p className="text-accent-cyan font-semibold text-sm mb-6">
              +${selectedStyle.price_per_edit.toFixed(2)} pending
            </p>
          )}
          <button
            onClick={() => setDone(false)}
            className="px-6 py-2.5 bg-accent-cyan text-background font-semibold rounded-xl text-sm hover:bg-accent-cyan/90 transition-colors"
          >
            Submit Another Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">Submit an Edit</h1>
      <p className="text-text-secondary text-sm mb-8">
        Select the content style, upload your finished edit, and we&apos;ll review it.
      </p>

      {/* Style selector */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium text-text-primary">Content Style</label>
          <HelpTip
            side="right"
            content="Select the style that matches the edit you made. This determines your pay rate. Check the Brand page if you're unsure which style fits your edit."
          />
        </div>
        <div className="grid grid-cols-1 gap-2">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyleId(style.id)}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all duration-200",
                selectedStyleId === style.id
                  ? "border-accent-cyan bg-accent-cyan/5 shadow-glow-cyan"
                  : "border-border bg-surface-raised hover:border-text-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br", style.gradient_class)} />
                <span className={cn("text-sm font-medium", selectedStyleId === style.id ? "text-text-primary" : "text-text-secondary")}>
                  {style.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-accent-cyan" />
                <span className="text-accent-cyan font-bold text-sm">{style.price_per_edit.toFixed(2)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* File upload */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium text-text-primary">Upload File</label>
          <HelpTip
            side="right"
            content="Upload your finished, exported video file. MP4 is recommended. Max 2 GB. You can drag and drop or click to browse. Submit as many edits per day as you want — there's no limit."
          />
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileChange(e.dataTransfer.files[0] ?? null); }}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200",
            isDragOver ? "border-accent-cyan bg-accent-cyan/5" : "border-border hover:border-accent-cyan/40 bg-surface-raised"
          )}
        >
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <Film className="w-10 h-10 text-accent-cyan" />
              <p className="text-text-primary font-medium text-sm">{file.name}</p>
              <p className="text-text-muted text-xs">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-text-muted" />
              <p className="text-text-secondary text-sm">Drag & drop your video here, or click to browse</p>
              <p className="text-text-muted text-xs">MP4, MOV, AVI — max 2 GB</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-text-muted mb-1.5">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
            <div className="h-full bg-accent-cyan rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || !selectedStyleId || uploading}
        className={cn(
          "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2",
          file && selectedStyleId && !uploading
            ? "bg-accent-cyan text-background hover:bg-accent-cyan/90 shadow-glow-cyan"
            : "bg-surface-raised text-text-muted cursor-not-allowed"
        )}
      >
        <Upload className="w-4 h-4" />
        {uploading ? "Uploading…" : "Submit Edit"}
      </button>
    </div>
  );
}
