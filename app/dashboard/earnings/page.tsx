"use client";

import { useEffect, useState } from "react";
import { DollarSign, Clock, CheckCircle, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { HelpTip } from "../_components/HelpTip";

type Earning = {
  id: string;
  amount: number;
  status: "pending" | "approved" | "paid";
  created_at: string;
  approved_at: string | null;
  content_styles: { name: string } | null;
  submissions: { file_name: string | null } | null;
};

type Profile = {
  pending_balance: number;
  approved_balance: number;
  total_earned: number;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "text-accent-orange bg-accent-orange/10 border-accent-orange/20",
  approved: "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20",
  paid: "text-accent-green bg-accent-green/10 border-accent-green/20",
};

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [payoutDone, setPayoutDone] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [earningsRes, profileRes] = await Promise.all([
      supabase
        .from("earnings")
        .select("id, amount, status, created_at, approved_at, content_style_id, submission_id")
        .eq("editor_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("pending_balance, approved_balance, total_earned").eq("id", user.id).single(),
    ]);

    const rawEarnings = earningsRes.data ?? [];

    // Fetch style names and file names separately
    const styleIds = Array.from(new Set(rawEarnings.map((e: {content_style_id: string}) => e.content_style_id).filter(Boolean)));
    const subIds   = Array.from(new Set(rawEarnings.map((e: {submission_id: string}) => e.submission_id).filter(Boolean)));

    const [stylesRes, subsRes] = await Promise.all([
      styleIds.length > 0 ? supabase.from("content_styles").select("id, name").in("id", styleIds) : Promise.resolve({ data: [] }),
      subIds.length > 0   ? supabase.from("submissions").select("id, file_name").in("id", subIds) : Promise.resolve({ data: [] }),
    ]);

    const styleMap: Record<string, string> = Object.fromEntries((stylesRes.data ?? []).map((s: {id: string; name: string}) => [s.id, s.name]));
    const subMap: Record<string, string>   = Object.fromEntries((subsRes.data ?? []).map((s: {id: string; file_name: string}) => [s.id, s.file_name]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEarnings((rawEarnings as any[]).map(e => ({
      ...e,
      content_styles: { name: styleMap[e.content_style_id] ?? "Unknown" },
      submissions: { file_name: subMap[e.submission_id] ?? null },
    })));
    setProfile(profileRes.data ?? null);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRequestPayout() {
    if (!profile || profile.approved_balance < 50) return;
    setRequesting(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired."); setRequesting(false); return; }

    const { data: profileData } = await supabase.from("profiles").select("payout_method, payout_details").eq("id", user.id).single();

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 14);

    const { error: reqError } = await supabase.from("payout_requests").insert({
      editor_id: user.id,
      amount: profile.approved_balance,
      payout_method: profileData?.payout_method,
      payout_details_snapshot: profileData?.payout_details,
      scheduled_pay_date: scheduledDate.toISOString(),
    });

    if (reqError) { setError(reqError.message); setRequesting(false); return; }

    setPayoutDone(true);
    setRequesting(false);
    load();
  }

  const canPayout = (profile?.approved_balance ?? 0) >= 50;

  function toggleRow(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Group by month
  const byMonth: Record<string, Earning[]> = {};
  earnings.forEach((e) => {
    const key = new Date(e.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(e);
  });

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">Earnings</h1>
      <p className="text-text-secondary text-sm mb-8">Track your income and request payouts.</p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent-orange" />
            <span className="text-xs text-text-muted">Pending Review</span>
            <HelpTip side="bottom" content="Earnings from edits currently under admin review. They move to Available once your edit is approved." />
          </div>
          <div className="text-2xl font-heading font-bold text-accent-orange">
            ${(profile?.pending_balance ?? 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-accent-cyan" />
            <span className="text-xs text-text-muted">Available</span>
            <HelpTip side="bottom" content="Approved earnings ready to cash out. Request a payout once you reach $50 and you'll be paid within 14 days." />
          </div>
          <div className="text-2xl font-heading font-bold text-accent-cyan">
            ${(profile?.approved_balance ?? 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-accent-green" />
            <span className="text-xs text-text-muted">Total Earned</span>
            <HelpTip side="bottom" content="Your all-time earnings across all approved edits. There is no cap — the more you submit, the higher this number grows." />
          </div>
          <div className="text-2xl font-heading font-bold text-accent-green">
            ${(profile?.total_earned ?? 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Payout request */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-text-primary">Request Payout</h3>
              <HelpTip side="top" content="Make sure your payout method (PayPal, Wise, or bank) is set up in Settings before requesting. Minimum $50. Payment sent within 14 days." />
            </div>
            <p className="text-text-muted text-sm mt-0.5">
              {canPayout
                ? "Your balance is ready. Payment will be sent within 2 weeks."
                : `Minimum payout is $50. You need $${(50 - (profile?.approved_balance ?? 0)).toFixed(2)} more.`}
            </p>
          </div>
          <button
            onClick={handleRequestPayout}
            disabled={!canPayout || requesting || payoutDone}
            className={cn(
              "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
              canPayout && !requesting && !payoutDone
                ? "bg-accent-cyan text-background hover:bg-accent-cyan/90 shadow-glow-cyan"
                : "bg-surface-raised text-text-muted cursor-not-allowed"
            )}
          >
            {payoutDone ? "Requested!" : requesting ? "Requesting…" : `Request $${(profile?.approved_balance ?? 0).toFixed(2)}`}
          </button>
        </div>
        {payoutDone && (
          <div className="mt-3 flex items-center gap-2 text-sm text-accent-green">
            <CheckCircle className="w-4 h-4" />
            Payout requested. Expected within 14 days.
          </div>
        )}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Earnings history */}
      <h2 className="font-heading font-semibold text-text-primary mb-4">History</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-surface-raised border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : earnings.length === 0 ? (
        <div className="text-center py-12 text-text-muted">No earnings yet. Submit your first edit to get started.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byMonth).map(([month, items]) => {
            const monthTotal = items.reduce((s, e) => s + e.amount, 0);
            const isOpen = expanded.has(month);
            return (
              <div key={month} className="bg-surface border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleRow(month)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-raised transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    <span className="font-medium text-text-primary text-sm">{month}</span>
                    <span className="text-xs text-text-muted">{items.length} edit{items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <span className="font-heading font-bold text-text-primary">${monthTotal.toFixed(2)}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-border">
                    {items.map((e) => (
                      <div key={e.id} className="flex items-center justify-between px-5 py-3 border-b border-border/50 last:border-0">
                        <div>
                          <p className="text-sm text-text-primary">{e.content_styles?.name ?? "Edit"}</p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {e.submissions?.file_name && ` · ${e.submissions.file_name}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium capitalize", STATUS_STYLES[e.status])}>
                            {e.status}
                          </span>
                          <span className="font-heading font-bold text-sm text-text-primary">${e.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
