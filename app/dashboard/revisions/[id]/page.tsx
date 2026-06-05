"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, Upload as UploadIcon, CheckCircle, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Submission = {
  id: string;
  file_name: string | null;
  file_url: string;
  status: string;
  admin_notes: string | null;
  revision_timestamp: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  content_style_id: string | null;
  styleName: string;
};

export default function RevisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Re-upload state
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sub } = await supabase
        .from("submissions")
        .select("id, file_name, file_url, status, admin_notes, revision_timestamp, submitted_at, reviewed_at, content_style_id")
        .eq("id", id)
        .eq("editor_id", user.id)
        .single();

      if (!sub) { setNotFound(true); setLoading(false); return; }

      // Get style name
      let styleName = "Unknown";
      if (sub.content_style_id) {
        const { data: style } = await supabase
          .from("content_styles").select("name").eq("id", sub.content_style_id).single();
        if (style) styleName = style.name;
      }

      // Generate signed URL for the private submissions bucket
      try {
        const parts = sub.file_url.split("/submissions/");
        if (parts.length > 1) {
          const storagePath = parts[1].split("?")[0];
          const { data } = await supabase.storage.from("submissions").createSignedUrl(storagePath, 3600);
          if (data?.signedUrl) setSignedUrl(data.signedUrl);
        }
      } catch {}

      setSubmission({ ...sub, styleName });
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleReupload() {
    if (!file || !submission) return;
    setUploading(true);
    setUploadError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploadError("Session expired."); setUploading(false); return; }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: storageErr } = await supabase.storage.from("submissions").upload(path, file, { upsert: false });
    if (storageErr) { setUploadError(storageErr.message); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("submissions").getPublicUrl(path);

    const { error: dbErr } = await supabase.from("submissions").update({
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      status: "re-uploaded",
      reviewed_at: null,
      admin_notes: null,
      revision_timestamp: null,
    }).eq("id", submission.id);

    if (dbErr) { setUploadError(dbErr.message); setUploading(false); return; }

    setDone(true);
    setUploading(false);
    setTimeout(() => router.push("/dashboard/revisions"), 2000);
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-6 w-48 bg-surface-raised rounded animate-pulse mb-6" />
        <div className="grid grid-cols-[3fr_2fr] gap-6">
          <div className="h-80 bg-surface-raised border border-border rounded-xl animate-pulse" />
          <div className="h-80 bg-surface-raised border border-border rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-8 text-center py-16 text-text-muted">
        Revision not found.{" "}
        <Link href="/dashboard/revisions" className="text-accent-cyan hover:underline">Go back</Link>
      </div>
    );
  }

  if (!submission) return null;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-text-muted mb-6">
        <Link href="/dashboard/revisions" className="hover:text-accent-cyan transition-colors">
          ← Revisions
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text-secondary truncate max-w-xs">{submission.file_name ?? "Edit"}</span>
      </div>

      <div className="grid grid-cols-[3fr_2fr] gap-6 items-start">
        {/* LEFT — video + re-upload */}
        <div className="flex flex-col gap-5">

          {/* Video player */}
          <div className="bg-black rounded-xl overflow-hidden border border-border">
            {signedUrl ? (
              <video
                controls
                className="w-full aspect-video"
                src={signedUrl}
              />
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center gap-3 bg-surface-raised">
                <Film className="w-10 h-10 text-text-muted" />
                <p className="text-sm text-text-muted">Video preview unavailable</p>
              </div>
            )}
            <div className="px-4 py-2 border-t border-border">
              <p className="text-xs text-text-muted font-mono truncate">{submission.file_name ?? "edit.mp4"}</p>
            </div>
          </div>

          {/* Re-upload section */}
          {submission.status === "revision" && (
            <div>
              <h3 className="font-heading font-bold text-text-primary text-sm mb-3">
                Re-upload Corrected Edit
              </h3>

              {done ? (
                <div className="flex flex-col items-center gap-2 py-8 text-accent-green">
                  <CheckCircle className="w-8 h-8" />
                  <p className="text-sm font-semibold">Re-upload submitted! Redirecting…</p>
                </div>
              ) : (
                <>
                  <div
                    onDragEnter={() => setIsDragOver(true)}
                    onDragLeave={() => setIsDragOver(false)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); setIsDragOver(false); setFile(e.dataTransfer.files[0] ?? null); }}
                    onClick={() => fileRef.current?.click()}
                    className={cn(
                      "h-32 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 border-2 border-dashed",
                      isDragOver
                        ? "border-accent-orange bg-accent-orange/10"
                        : "border-accent-orange/40 hover:border-accent-orange hover:bg-accent-orange/5"
                    )}
                  >
                    <input ref={fileRef} type="file" accept="video/*" className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                    {file ? (
                      <>
                        <Film className="w-6 h-6 text-accent-orange" />
                        <p className="text-sm text-text-primary font-medium">{file.name}</p>
                        <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                      </>
                    ) : (
                      <>
                        <UploadIcon className="w-6 h-6 text-accent-orange" />
                        <p className="text-sm text-text-secondary">Drop corrected edit here or click to browse</p>
                        <span className="text-xs text-text-muted">MP4, MOV — max 2GB</span>
                      </>
                    )}
                  </div>

                  {uploadError && (
                    <p className="mt-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{uploadError}</p>
                  )}

                  <button
                    onClick={handleReupload}
                    disabled={!file || uploading}
                    className={cn(
                      "mt-3 w-full py-2.5 rounded-xl font-semibold text-sm transition-colors",
                      file && !uploading
                        ? "bg-accent-orange text-background hover:bg-accent-orange/90"
                        : "bg-surface-raised text-text-muted cursor-not-allowed"
                    )}
                  >
                    {uploading ? "Uploading…" : "Submit Re-upload"}
                  </button>
                </>
              )}
            </div>
          )}

          {submission.status === "re-uploaded" && (
            <div className="flex items-center gap-2 px-4 py-3 bg-accent-green/10 border border-accent-green/30 rounded-xl text-sm text-accent-green">
              <CheckCircle className="w-4 h-4 shrink-0" />
              You&apos;ve already re-uploaded this edit. Awaiting admin review.
            </div>
          )}
        </div>

        {/* RIGHT — admin notes + info */}
        <div className="flex flex-col gap-5">

          {/* Submission info */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Style</span>
              <span className="text-text-primary font-medium">{submission.styleName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Submitted</span>
              <span className="text-text-secondary">
                {new Date(submission.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            {submission.reviewed_at && (
              <div className="flex justify-between">
                <span className="text-text-muted">Reviewed</span>
                <span className="text-text-secondary">
                  {new Date(submission.reviewed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}
          </div>

          {/* Admin notes */}
          <div>
            <h3 className="font-heading font-bold text-text-primary text-base mb-3">Admin Notes</h3>
            {submission.admin_notes ? (
              <div className="bg-surface-raised border border-accent-orange/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-accent-purple/20 flex items-center justify-center text-xs font-bold text-accent-purple shrink-0">
                    A
                  </div>
                  <span className="text-xs font-medium text-text-primary">Admin</span>
                  {submission.reviewed_at && (
                    <span className="text-xs text-text-muted ml-auto">
                      {new Date(submission.reviewed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>

                {submission.revision_timestamp && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-accent-orange/15 text-accent-orange mb-3">
                    <Clock className="w-3 h-3" />
                    {submission.revision_timestamp}
                  </div>
                )}

                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {submission.admin_notes}
                </p>
              </div>
            ) : (
              <div className="bg-surface-raised border border-border rounded-xl p-4 text-sm text-text-muted">
                No notes from admin yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
