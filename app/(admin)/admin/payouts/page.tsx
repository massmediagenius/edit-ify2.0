"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, CheckCircle, Clock } from "lucide-react";
import { useToast, Toaster } from "@/app/(admin)/_components/Toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type PayoutRequest = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "paid" | "rejected";
  payout_method: string | null;
  payout_details_snapshot: Record<string, string> | null;
  requested_at: string;
  scheduled_pay_date: string | null;
  paid_at: string | null;
  profiles: { full_name: string | null } | null;
};

const METHOD_DETAIL: Record<string, (d: Record<string, string>) => string> = {
  paypal: (d) => `PayPal: ${d.email ?? "—"}`,
  wise: (d) => `Wise: ${d.email ?? "—"} (${d.currency ?? "USD"})`,
  bank: (d) => `Bank: ${d.bank ?? "—"} ····${(d.account ?? "").slice(-4)}`,
};

export default function PayoutsPage() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toasts, toast } = useToast();

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("payout_requests")
      .select("id, amount, status, payout_method, payout_details_snapshot, requested_at, scheduled_pay_date, paid_at, profiles(full_name)")
      .order("requested_at", { ascending: false });
    setRequests((data as unknown as PayoutRequest[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markPaid(ids: string[]) {
    const supabase = createClient();
    await Promise.all(ids.map((id) =>
      supabase.from("payout_requests").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id)
    ));

    // Also mark associated earnings as paid and decrement approved_balance
    for (const id of ids) {
      const req = requests.find((r) => r.id === id);
      if (!req || !req.profiles) continue;

      // Get the profile id via separate query since we can't easily join back
      const { data: profileData } = await supabase
        .from("payout_requests")
        .select("editor_id")
        .eq("id", id)
        .single();

      if (profileData) {
        await supabase.from("profiles")
          .update({ approved_balance: 0 })
          .eq("id", (profileData as { editor_id: string }).editor_id);
      }
    }

    setRequests((prev) => prev.map((r) => ids.includes(r.id) ? { ...r, status: "paid" as const } : r));
    setSelected(new Set());
    toast(`${ids.length} payout${ids.length > 1 ? "s" : ""} marked as paid.`, "success");
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function exportCSV() {
    const headers = ["Editor", "Amount", "Method", "Details", "Requested", "Scheduled Pay Date", "Status"];
    const rows = requests.map((r) => {
      const details = r.payout_details_snapshot && r.payout_method
        ? METHOD_DETAIL[r.payout_method]?.(r.payout_details_snapshot) ?? "—"
        : "—";
      return [
        r.profiles?.full_name ?? "Unknown",
        `$${r.amount.toFixed(2)}`,
        r.payout_method ?? "—",
        details,
        new Date(r.requested_at).toLocaleDateString(),
        r.scheduled_pay_date ? new Date(r.scheduled_pay_date).toLocaleDateString() : "—",
        r.status,
      ].map((v) => `"${v}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "payouts.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const pending = requests.filter((r) => r.status === "pending");
  const totalOwed = pending.reduce((s, r) => s + r.amount, 0);
  const selectedUnpaid = Array.from(selected).filter((id) => requests.find((r) => r.id === id && r.status === "pending"));

  return (
    <div className="p-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-text-muted mb-1">Total Owed</div>
          <div className="text-2xl font-heading font-bold text-text-primary">${totalOwed.toFixed(2)}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-text-muted mb-1">Pending Requests</div>
          <div className="text-2xl font-heading font-bold text-accent-orange">{pending.length}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-text-muted mb-1">Paid Out (All Time)</div>
          <div className="text-2xl font-heading font-bold text-accent-green">
            ${requests.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-xl font-bold text-text-primary">Payout Requests</h1>
        <div className="flex gap-2">
          {selectedUnpaid.length > 0 && (
            <button
              onClick={() => markPaid(selectedUnpaid)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-green text-white font-semibold rounded-lg text-sm hover:bg-accent-green/90 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Pay Selected ({selectedUnpaid.length})
            </button>
          )}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-surface-raised border border-border text-text-secondary rounded-lg text-sm hover:text-text-primary transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 w-10" />
              {["Editor", "Amount", "Payout Details", "Requested", "Scheduled", "Status", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-text-muted">Loading…</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-text-muted">No payout requests yet.</td></tr>
            ) : requests.map((req) => {
              const details = req.payout_details_snapshot && req.payout_method
                ? METHOD_DETAIL[req.payout_method]?.(req.payout_details_snapshot) ?? "—"
                : "—";
              const isPending = req.status === "pending";

              return (
                <tr key={req.id} className="border-b border-border/50 last:border-0 hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3">
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={selected.has(req.id)}
                        onChange={() => toggleSelect(req.id)}
                        className="rounded border-border"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent-purple/20 flex items-center justify-center text-xs font-bold text-accent-purple shrink-0">
                        {(req.profiles?.full_name ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <span className="text-sm text-text-primary">{req.profiles?.full_name ?? "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-text-primary">${req.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{details}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {new Date(req.requested_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {req.scheduled_pay_date
                      ? new Date(req.scheduled_pay_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                      req.status === "paid" ? "bg-accent-green/10 text-accent-green" :
                      req.status === "pending" ? "bg-accent-orange/10 text-accent-orange" :
                      "bg-surface-raised text-text-muted"
                    )}>
                      {req.status === "pending" && <Clock className="w-3 h-3 inline mr-1" />}
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isPending && (
                      <button
                        onClick={() => markPaid([req.id])}
                        className="text-xs font-medium text-accent-green hover:underline"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Toaster toasts={toasts} />
    </div>
  );
}
