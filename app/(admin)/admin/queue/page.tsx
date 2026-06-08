"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { ReviewModal, type EditRow } from "@/app/(admin)/_components/ReviewModal";
import { useToast, Toaster } from "@/app/(admin)/_components/Toast";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type RowStatus = "re-uploaded" | "pending" | "approved" | "revision" | "rejected";

type Submission = {
  id: string;
  editor_id: string;
  status: RowStatus;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  submitted_at: string;
  admin_notes: string | null;
  revision_timestamp: string | null;
  profiles: { full_name: string | null } | null;
  content_styles: { name: string } | null;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

export default function QueuePage() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RowStatus | "all">("all");
  const [selectedEdit, setSelectedEdit] = useState<EditRow | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, toast } = useToast();

  const load = useCallback(async () => {
    const supabase = createClient();

    // Fetch submissions without PostgREST joins to avoid FK cache issues
    const { data: subs, error } = await supabase
      .from("submissions")
      .select("id, editor_id, content_style_id, status, file_url, file_name, file_size, submitted_at, admin_notes, revision_timestamp")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Queue fetch error:", error.message);
      setLoading(false);
      return;
    }
    if (!subs || subs.length === 0) { setRows([]); setLoading(false); return; }

    // Fetch related data separately
    const editorIds = Array.from(new Set((subs as {editor_id: string}[]).map(s => s.editor_id)));
    const styleIds  = Array.from(new Set((subs as {content_style_id: string}[]).map(s => s.content_style_id)));

    const [profilesRes, stylesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", editorIds),
      supabase.from("content_styles").select("id, name").in("id", styleIds),
    ]);

    const profileMap: Record<string, string> = Object.fromEntries(
      (profilesRes.data ?? []).map((p: {id: string; full_name: string}) => [p.id, p.full_name])
    );
    const styleMap: Record<string, string> = Object.fromEntries(
      (stylesRes.data ?? []).map((s: {id: string; name: string}) => [s.id, s.name])
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRows((subs as any[]).map(s => ({
      ...s,
      profiles: { full_name: profileMap[s.editor_id] ?? null },
      content_styles: { name: styleMap[s.content_style_id] ?? "Unknown" },
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      (r.profiles?.full_name ?? "").toLowerCase().includes(q) ||
      (r.content_styles?.name ?? "").toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function openReview(row: Submission) {
    // Generate a signed URL so the private submissions bucket video plays
    let videoUrl = row.file_url;
    try {
      const supabase = createClient();
      // Extract storage path from the file_url
      const parts = row.file_url.split("/submissions/");
      if (parts.length > 1) {
        const storagePath = parts[1].split("?")[0];
        const { data } = await supabase.storage.from("submissions").createSignedUrl(storagePath, 3600);
        if (data?.signedUrl) videoUrl = data.signedUrl;
      }
    } catch {}

    setSelectedEdit({
      id: row.id,
      userId: row.editor_id,
      category: row.content_styles?.name ?? "Unknown",
      status: row.status,
      submitted: new Date(row.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      fileSize: formatSize(row.file_size),
      fileUrl: videoUrl,
      editorName: row.profiles?.full_name ?? "Unknown",
    });
  }

  async function handleApprove(submissionId: string) {
    const supabase = createClient();

    // Update submission status
    await supabase.from("submissions").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", submissionId);

    // Update earnings status → DB trigger handles balance update
    await supabase.from("earnings").update({ status: "approved" }).eq("submission_id", submissionId);

    setRows((prev) => prev.map((r) => r.id === submissionId ? { ...r, status: "approved" as RowStatus } : r));
    toast("Edit approved — balance updated for editor.", "success");
    setSelectedEdit(null);
  }

  async function handleRevisionSent(submissionId: string, notes: string, timestamp: string) {
    const supabase = createClient();
    await supabase.from("submissions").update({
      status: "revision",
      admin_notes: notes,
      revision_timestamp: timestamp || null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", submissionId);

    setRows((prev) => prev.map((r) => r.id === submissionId ? { ...r, status: "revision" as RowStatus, admin_notes: notes } : r));
    toast("Revision notes sent to editor.", "warning");
  }

  async function handleRejected(submissionId: string, note: string) {
    const supabase = createClient();
    await supabase.from("submissions").update({
      status: "rejected",
      admin_notes: note,
      reviewed_at: new Date().toISOString(),
    }).eq("id", submissionId);

    // Cancel earnings row → DB trigger subtracts amount from editor's pending_balance
    await supabase.from("earnings").update({ status: "cancelled" }).eq("submission_id", submissionId);

    setRows((prev) => prev.map((r) => r.id === submissionId ? { ...r, status: "rejected" as RowStatus, admin_notes: note } : r));
    toast("Submission rejected — pending balance reversed.", "error");
  }

  const STATUS_OPTIONS: { value: RowStatus | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "re-uploaded", label: "Re-uploaded" },
    { value: "revision", label: "Revision" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="p-4 md:p-6">
      <ReviewModal
        key={selectedEdit?.id ?? "none"}
        edit={selectedEdit}
        onClose={() => setSelectedEdit(null)}
        onApprove={handleApprove}
        onRevisionSent={handleRevisionSent}
        onRejected={handleRejected}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary">Edit Queue</h1>
          <p className="text-text-secondary text-sm mt-0.5">{rows.filter(r => r.status === "pending" || r.status === "re-uploaded").length} awaiting review</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex gap-1 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  statusFilter === opt.value ? "bg-accent-cyan/15 text-accent-cyan" : "text-text-muted hover:text-text-secondary hover:bg-surface-raised"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search editors, categories…"
              className="bg-surface-raised border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 w-full sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Editor", "Category", "Status", "Submitted", "File Size", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-text-muted">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-text-muted">No submissions found.</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id} className="border-b border-border/50 last:border-0 hover:bg-surface-raised transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent-purple/20 flex items-center justify-center text-xs font-bold text-accent-purple shrink-0">
                      {(row.profiles?.full_name ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <span className="text-sm text-text-primary">{row.profiles?.full_name ?? "Unknown"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">{row.content_styles?.name ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-3 text-sm text-text-muted">
                  {new Date(row.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">{formatSize(row.file_size)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openReview(row)}
                    className="text-xs font-medium text-accent-cyan hover:underline"
                  >
                    Review →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-20 bg-surface-raised border border-border rounded-xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-text-muted">No submissions found.</div>
        ) : filtered.map((row) => (
          <div
            key={row.id}
            onClick={() => openReview(row)}
            className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3 active:bg-surface-raised transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-accent-purple/20 flex items-center justify-center text-xs font-bold text-accent-purple shrink-0">
              {(row.profiles?.full_name ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold text-text-primary truncate">{row.profiles?.full_name ?? "Unknown"}</span>
                <StatusBadge status={row.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
                <span>{row.content_styles?.name ?? "—"}</span>
                <span>·</span>
                <span>{new Date(row.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <span>·</span>
                <span>{formatSize(row.file_size)}</span>
              </div>
            </div>
            <span className="text-xs font-medium text-accent-cyan shrink-0">Review →</span>
          </div>
        ))}
      </div>

      <Toaster toasts={toasts} />
    </div>
  );
}
