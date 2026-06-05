"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Editor = {
  id: string;
  full_name: string | null;
  payout_method: string | null;
  payout_details: Record<string, string> | null;
  pending_balance: number;
  approved_balance: number;
  total_earned: number;
  editing_software: string[] | null;
  created_at: string;
  submission_count?: number;
};

const AVATAR_COLORS = [
  "bg-accent-cyan/20 text-accent-cyan",
  "bg-accent-purple/20 text-accent-purple",
  "bg-accent-green/20 text-accent-green",
  "bg-accent-orange/20 text-accent-orange",
  "bg-accent-yellow/20 text-accent-yellow",
];

export default function EditorsPage() {
  const [editors, setEditors] = useState<Editor[]>([]);
  const [drawerEditor, setDrawerEditor] = useState<Editor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, payout_method, payout_details, pending_balance, approved_balance, total_earned, editing_software, created_at")
        .eq("role", "editor")
        .order("created_at", { ascending: false });

      if (!profiles) { setLoading(false); return; }

      // Get submission counts
      const { data: counts } = await supabase
        .from("submissions")
        .select("editor_id");

      const countMap: Record<string, number> = {};
      (counts ?? []).forEach((r: { editor_id: string }) => { countMap[r.editor_id] = (countMap[r.editor_id] ?? 0) + 1; });

      setEditors(profiles.map((p) => ({ ...p, submission_count: countMap[p.id] ?? 0 })) as unknown as Editor[]);
      setLoading(false);
    }
    load();
  }, []);

  function payoutLabel(editor: Editor) {
    const d = editor.payout_details ?? {};
    if (editor.payout_method === "paypal") return `PayPal: ${d.email ?? "—"}`;
    if (editor.payout_method === "wise") return `Wise: ${d.email ?? "—"} (${d.currency ?? "USD"})`;
    if (editor.payout_method === "bank") return `Bank ····${(d.account ?? "").slice(-4)}`;
    return "Not set";
  }

  return (
    <div className="p-6 relative">
      <h1 className="font-heading text-xl font-bold text-text-primary mb-1">Editors</h1>
      <p className="text-text-secondary text-sm mb-6">{editors.length} editors on the platform</p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-48 bg-surface-raised border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : editors.length === 0 ? (
        <div className="text-center py-16 text-text-muted">No editors signed up yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {editors.map((editor, i) => {
            const initials = (editor.full_name ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
            const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <GlowCard key={editor.id}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-base font-bold", avatarColor)}>
                      {initials}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-text-muted">Total Earned</div>
                      <div className="text-sm font-bold text-accent-green">${editor.total_earned.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="font-semibold text-text-primary text-sm">{editor.full_name ?? "Unknown"}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    Joined {new Date(editor.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </div>

                  <div className="flex gap-3 mt-3 text-xs">
                    <div>
                      <div className="text-text-muted">Edits</div>
                      <div className="font-semibold text-text-primary">{editor.submission_count}</div>
                    </div>
                    <div>
                      <div className="text-text-muted">Pending</div>
                      <div className="font-semibold text-accent-orange">${editor.pending_balance.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-text-muted">Available</div>
                      <div className="font-semibold text-accent-cyan">${editor.approved_balance.toFixed(2)}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setDrawerEditor(editor)}
                    className="w-full mt-4 py-2 text-xs font-medium text-text-secondary border border-border rounded-lg hover:border-accent-cyan hover:text-accent-cyan transition-colors"
                  >
                    View Profile →
                  </button>
                </div>
              </GlowCard>
            );
          })}
        </div>
      )}

      {/* Slide-in profile drawer */}
      {drawerEditor && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setDrawerEditor(null)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-surface border-l border-border z-40 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-bold text-text-primary">Editor Profile</h2>
                <button onClick={() => setDrawerEditor(null)} className="w-8 h-8 rounded-full hover:bg-surface-raised flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-text-secondary" />
                </button>
              </div>

              {(() => {
                const i = editors.indexOf(drawerEditor);
                const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const initials = (drawerEditor.full_name ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold", avatarColor)}>{initials}</div>
                      <div>
                        <div className="font-semibold text-text-primary">{drawerEditor.full_name ?? "Unknown"}</div>
                        <div className="text-xs text-text-muted">
                          Joined {new Date(drawerEditor.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-surface-raised border border-border rounded-xl p-4 grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-text-muted">Total Earned</div>
                          <div className="font-bold text-accent-green">${drawerEditor.total_earned.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-text-muted">Submissions</div>
                          <div className="font-bold text-text-primary">{drawerEditor.submission_count}</div>
                        </div>
                        <div>
                          <div className="text-xs text-text-muted">Pending</div>
                          <div className="font-bold text-accent-orange">${drawerEditor.pending_balance.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-text-muted">Available</div>
                          <div className="font-bold text-accent-cyan">${drawerEditor.approved_balance.toFixed(2)}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Payout Method</div>
                        <div className="bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm text-text-secondary">{payoutLabel(drawerEditor)}</div>
                      </div>

                      {drawerEditor.editing_software && drawerEditor.editing_software.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Software</div>
                          <div className="flex flex-wrap gap-1.5">
                            {drawerEditor.editing_software.map((s) => (
                              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-secondary">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
