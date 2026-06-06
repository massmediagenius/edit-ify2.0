"use client";

import { useEffect, useState } from "react";
import { Play, X, Download, ExternalLink } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { HelpTip } from "../_components/HelpTip";

type SubmissionStatus = "pending" | "approved" | "revision" | "re-uploaded" | "rejected";

type Submission = {
  id: string;
  file_name: string | null;
  file_url: string;
  file_size: number | null;
  status: SubmissionStatus;
  admin_notes: string | null;
  revision_timestamp: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  content_style_id: string | null;
  styleName: string;
};

type Tab = "all" | "pending" | "revision" | "approved" | "rejected";

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function VideoPreviewModal({ submission, onClose }: { submission: Submission; onClose: () => void }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  useEffect(() => {
    async function getSignedUrl() {
      try {
        const supabase = createClient();
        const parts = submission.file_url.split("/submissions/");
        if (parts.length > 1) {
          const storagePath = parts[1].split("?")[0];
          const { data } = await supabase.storage.from("submissions").createSignedUrl(storagePath, 3600);
          if (data?.signedUrl) { setVideoUrl(data.signedUrl); setLoading(false); return; }
        }
      } catch {}
      setVideoUrl(submission.file_url);
      setLoading(false);
    }
    getSignedUrl();
  }, [submission]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-text-primary font-medium text-sm truncate max-w-sm">{submission.file_name ?? "Submission"}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-text-muted text-xs">{submission.styleName}</span>
              {submission.file_size && <span className="text-text-muted text-xs">· {formatSize(submission.file_size)}</span>}
              <StatusBadge status={submission.status} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {videoUrl && (
              <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-raised border border-border text-text-secondary text-xs font-medium rounded-lg hover:border-accent-cyan hover:text-accent-cyan transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </a>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-raised flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>
        <div className="bg-black flex items-center justify-center min-h-[300px]">
          {loading ? (
            <div className="text-text-muted text-sm">Loading preview…</div>
          ) : videoUrl ? (
            <video controls src={videoUrl} className="w-full max-h-[480px]" autoPlay />
          ) : (
            <div className="flex flex-col items-center gap-3 py-12">
              <Download className="w-10 h-10 text-text-muted" />
              <p className="text-text-muted text-sm">Preview unavailable</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [preview, setPreview] = useState<Submission | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subs } = await supabase
        .from("submissions")
        .select("id, file_name, file_url, file_size, status, admin_notes, revision_timestamp, submitted_at, reviewed_at, content_style_id")
        .eq("editor_id", user.id)
        .order("submitted_at", { ascending: false });

      if (!subs || subs.length === 0) { setSubmissions([]); setLoading(false); return; }

      const styleIds = Array.from(new Set((subs as { content_style_id: string }[]).map(s => s.content_style_id).filter(Boolean)));
      const { data: styles } = await supabase.from("content_styles").select("id, name").in("id", styleIds);

      const styleMap: Record<string, string> = Object.fromEntries(
        (styles ?? []).map((s: { id: string; name: string }) => [s.id, s.name])
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSubmissions((subs as any[]).map(s => ({ ...s, styleName: styleMap[s.content_style_id] ?? "Unknown" })));
      setLoading(false);
    }
    load();
  }, []);

  const pending = submissions.filter(s => s.status === "pending" || s.status === "re-uploaded");
  const needsRevision = submissions.filter(s => s.status === "revision");
  const rejected = submissions.filter(s => s.status === "rejected");

  const filtered = tab === "all" ? submissions
    : tab === "pending" ? submissions.filter(s => s.status === "pending" || s.status === "re-uploaded")
    : tab === "revision" ? submissions.filter(s => s.status === "revision")
    : tab === "rejected" ? submissions.filter(s => s.status === "rejected")
    : submissions.filter(s => s.status === "approved");

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "all", label: "All", count: submissions.length },
    { id: "pending", label: "Pending Review", count: pending.length },
    { id: "revision", label: "Needs Revision", count: needsRevision.length },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected", count: rejected.length },
  ];

  return (
    <>
      {preview && <VideoPreviewModal submission={preview} onClose={() => setPreview(null)} />}

      <div className="p-4 md:p-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <h1 className="font-heading text-2xl font-bold text-text-primary">My Submissions</h1>
          <HelpTip
            side="bottom"
            width="w-72"
            content="Track every edit you've submitted. Pending = under review. Revision = admin needs changes, check their notes and re-upload. Approved = accepted and payment added to your balance. Click any card to preview your video."
          />
          {needsRevision.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-orange/15 text-accent-orange text-sm font-semibold">
              {needsRevision.length} need{needsRevision.length === 1 ? "s" : ""} revision
            </span>
          )}
          {rejected.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-sm font-semibold">
              {rejected.length} rejected
            </span>
          )}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 flex items-center gap-1.5",
                tab === id
                  ? "bg-accent-cyan text-background"
                  : "bg-surface-raised border border-border text-text-secondary hover:text-text-primary"
              )}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className={cn("text-xs rounded-full px-1.5 py-0.5 leading-none font-bold",
                  tab === id ? "bg-black/20 text-background" : "bg-surface text-text-muted")}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-surface-raised border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            {tab === "all" ? "No submissions yet. Upload your first edit!" : "No submissions in this category."}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((sub) => (
              <GlowCard
                key={sub.id}
                glow={false}
                className={cn(
                  "p-5 border-l-4",
                  sub.status === "revision" ? "border-l-accent-orange"
                    : sub.status === "approved" ? "border-l-accent-green"
                    : sub.status === "re-uploaded" ? "border-l-accent-purple"
                    : sub.status === "rejected" ? "border-l-red-500"
                    : "border-l-border"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                      <span className="font-heading font-bold text-text-primary text-base truncate max-w-xs">
                        {sub.file_name ?? "Untitled Edit"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-secondary">
                        {sub.styleName}
                      </span>
                      <StatusBadge status={sub.status} />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-muted mb-3 flex-wrap">
                      <span>Submitted {new Date(sub.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      {sub.reviewed_at && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>Reviewed {new Date(sub.reviewed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </>
                      )}
                      {sub.file_size && <span className="w-1 h-1 rounded-full bg-border" />}
                      {sub.file_size && <span>{formatSize(sub.file_size)}</span>}
                    </div>

                    {sub.status === "rejected" && sub.admin_notes && (
                      <div className="mt-1 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-red-400 mb-0.5">Rejection Reason</p>
                        <p className="text-sm text-red-300 line-clamp-3">{sub.admin_notes}</p>
                      </div>
                    )}
                    {sub.status !== "rejected" && sub.admin_notes && (
                      <p className="text-sm text-text-secondary line-clamp-2">
                        <span className="text-text-muted mr-1.5">Admin:</span>
                        {sub.revision_timestamp && (
                          <span className="text-accent-orange font-mono mr-1.5">[{sub.revision_timestamp}]</span>
                        )}
                        {sub.admin_notes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setPreview(sub)}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg border border-accent-cyan/50 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/10 transition-colors whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Preview
                  </button>
                </div>
              </GlowCard>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
