"use client";

import { useEffect, useState, useCallback } from "react";
import { Download } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { ReviewModal, type EditRow } from "@/app/(admin)/_components/ReviewModal";
import { useToast, Toaster } from "@/app/(admin)/_components/Toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Submission = {
  id: string;
  editor_id: string;
  status: "approved" | "pending" | "revision" | "re-uploaded" | "rejected";
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  submitted_at: string;
  profiles: { full_name: string | null } | null;
  content_styles: { name: string; gradient_class: string; price_per_edit: number } | null;
};

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-accent-green/15 text-accent-green",
  pending: "bg-accent-cyan/15 text-accent-cyan",
  revision: "bg-accent-orange/15 text-accent-orange",
  "re-uploaded": "bg-accent-orange/15 text-accent-orange",
  rejected: "bg-red-500/15 text-red-400",
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

export default function LibraryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [editorFilter, setEditorFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedEdit, setSelectedEdit] = useState<EditRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toasts, toast } = useToast();

  const load = useCallback(async () => {
    const supabase = createClient();

    const { data: subs, error } = await supabase
      .from("submissions")
      .select("id, editor_id, content_style_id, status, file_url, file_name, file_size, submitted_at")
      .order("submitted_at", { ascending: false });

    if (error || !subs || subs.length === 0) { setSubmissions([]); setLoading(false); return; }

    const editorIds = Array.from(new Set((subs as {editor_id: string}[]).map(s => s.editor_id)));
    const styleIds  = Array.from(new Set((subs as {content_style_id: string}[]).map(s => s.content_style_id)));

    const [profilesRes, stylesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", editorIds),
      supabase.from("content_styles").select("id, name, gradient_class, price_per_edit").in("id", styleIds),
    ]);

    const profileMap: Record<string, string> = Object.fromEntries(
      (profilesRes.data ?? []).map((p: {id: string; full_name: string}) => [p.id, p.full_name])
    );
    const styleMap: Record<string, {name: string; gradient_class: string; price_per_edit: number}> = Object.fromEntries(
      (stylesRes.data ?? []).map((s: {id: string; name: string; gradient_class: string; price_per_edit: number}) => [s.id, s])
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newSubs: Submission[] = (subs as any[]).map(s => ({
      ...s,
      profiles: { full_name: profileMap[s.editor_id] ?? null },
      content_styles: styleMap[s.content_style_id] ?? { name: "Unknown", gradient_class: "", price_per_edit: 0 },
    }));

    setSubmissions(newSubs);
    setLoading(false);

    // Generate signed URLs for all submissions in parallel
    const urlEntries = await Promise.all(
      newSubs.map(async (s) => {
        try {
          const parts = s.file_url.split("/submissions/");
          if (parts.length > 1) {
            const path = parts[1].split("?")[0];
            const { data } = await supabase.storage.from("submissions").createSignedUrl(path, 3600);
            if (data?.signedUrl) return [s.id, data.signedUrl] as [string, string];
          }
        } catch {}
        return [s.id, ""] as [string, string];
      })
    );
    setSignedUrls(Object.fromEntries(urlEntries));
  }, []);

  useEffect(() => { load(); }, [load]);

  const editors = ["All", ...Array.from(new Set(submissions.map((s) => s.profiles?.full_name ?? "Unknown")))];
  const categories = ["All", ...Array.from(new Set(submissions.map((s) => s.content_styles?.name ?? "Unknown")))];
  const statuses = ["All", "approved", "pending", "revision", "re-uploaded", "rejected"];

  const filtered = submissions.filter((s) => {
    const matchEditor = editorFilter === "All" || (s.profiles?.full_name ?? "Unknown") === editorFilter;
    const matchCategory = categoryFilter === "All" || (s.content_styles?.name ?? "Unknown") === categoryFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchEditor && matchCategory && matchStatus;
  });

  function openReview(s: Submission) {
    const videoUrl = signedUrls[s.id] || s.file_url;
    setSelectedEdit({
      id: s.id,
      userId: s.editor_id,
      category: s.content_styles?.name ?? "Unknown",
      status: s.status,
      submitted: new Date(s.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      fileSize: formatSize(s.file_size),
      fileUrl: videoUrl,
      editorName: s.profiles?.full_name ?? "Unknown",
    });
  }

  async function handleDownload(s: Submission, e: React.MouseEvent) {
    e.stopPropagation();
    setDownloading(s.id);
    const url = signedUrls[s.id] || s.file_url;
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = s.file_name ?? "submission.mp4";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
    setDownloading(null);
  }

  async function handleApprove(id: string) {
    const supabase = createClient();
    await supabase.from("submissions").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("earnings").update({ status: "approved" }).eq("submission_id", id);
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: "approved" as const } : s));
    toast("Edit approved.", "success");
    setSelectedEdit(null);
  }

  async function handleRevisionSent(id: string, notes: string, ts: string) {
    const supabase = createClient();
    await supabase.from("submissions").update({ status: "revision", admin_notes: notes, revision_timestamp: ts || null, reviewed_at: new Date().toISOString() }).eq("id", id);
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: "revision" as const } : s));
    toast("Revision notes sent.", "warning");
  }

  async function handleRejected(id: string, note: string) {
    const supabase = createClient();
    await supabase.from("submissions").update({ status: "rejected", admin_notes: note, reviewed_at: new Date().toISOString() }).eq("id", id);

    // Cancel earnings row → DB trigger subtracts amount from editor's pending_balance
    await supabase.from("earnings").update({ status: "cancelled" }).eq("submission_id", id);

    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: "rejected" as const } : s));
    toast("Submission rejected — pending balance reversed.", "error");
  }

  return (
    <div className="p-4 md:p-6">
      <ReviewModal edit={selectedEdit} onClose={() => setSelectedEdit(null)} onApprove={handleApprove} onRevisionSent={handleRevisionSent} onRejected={handleRejected} />

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <h1 className="font-heading text-xl font-bold text-text-primary flex-1">Edit Library</h1>

        {[
          { label: "Editor", value: editorFilter, options: editors, set: setEditorFilter },
          { label: "Category", value: categoryFilter, options: categories, set: setCategoryFilter },
          { label: "Status", value: statusFilter, options: statuses, set: setStatusFilter },
        ].map(({ label, value, options, set }) => (
          <select key={label} value={value} onChange={(e) => set(e.target.value)}
            className="bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-accent-cyan/50">
            <option value="All">{label}: All</option>
            {options.filter((o) => o !== "All").map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}

        <button onClick={() => { setEditorFilter("All"); setCategoryFilter("All"); setStatusFilter("All"); }}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors">Reset</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-52 bg-surface-raised border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted">No edits found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((s) => (
            <GlowCard key={s.id} className="cursor-pointer overflow-hidden" onClick={() => openReview(s)}>
              {/* Video thumbnail or gradient fallback */}
              <div className="relative w-full h-32 bg-black rounded-t-xl overflow-hidden">
                {signedUrls[s.id] ? (
                  <video
                    src={signedUrls[s.id]}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                  />
                ) : (
                  <div className={cn("w-full h-full bg-gradient-to-br", s.content_styles?.gradient_class ?? "from-surface to-surface-raised")} />
                )}
                {/* Download button overlay */}
                <button
                  onClick={(e) => handleDownload(s, e)}
                  disabled={downloading === s.id}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white transition-colors disabled:opacity-50"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STATUS_STYLES[s.status] ?? "")}>{s.status}</span>
                  <span className="text-xs text-text-muted">{s.content_styles?.price_per_edit ? `$${s.content_styles.price_per_edit.toFixed(2)}` : ""}</span>
                </div>
                <p className="text-text-primary text-xs font-semibold truncate">{s.content_styles?.name ?? "Unknown"}</p>
                <p className="text-text-muted text-xs mt-0.5">{s.profiles?.full_name ?? "Unknown"}</p>
                <p className="text-text-muted text-xs">{new Date(s.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
              </div>
            </GlowCard>
          ))}
        </div>
      )}

      <Toaster toasts={toasts} />
    </div>
  );
}
