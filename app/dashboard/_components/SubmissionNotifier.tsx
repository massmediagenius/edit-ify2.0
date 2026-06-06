"use client";

import { useEffect, useState } from "react";
import { Check, X, AlertTriangle, Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type NotifType = "approved" | "revision" | "rejected";

type NotifItem = {
  uid: string;
  key: string;
  type: NotifType;
  category: string;
  adminNote?: string | null;
};

const SEEN_KEY = "editify_notifs_seen_v1";
const MAX_AGE_DAYS = 7;
const AUTO_DISMISS_MS = 8000;

const CONFIG: Record<NotifType, {
  Icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  title: string;
  body: (cat: string) => string;
}> = {
  approved: {
    Icon: Check,
    color: "text-accent-green",
    bg: "bg-accent-green/10",
    border: "border-accent-green/30",
    title: "Edit Approved!",
    body: (cat) => `Your ${cat} edit was approved — payment added to your balance.`,
  },
  revision: {
    Icon: AlertTriangle,
    color: "text-accent-orange",
    bg: "bg-accent-orange/10",
    border: "border-accent-orange/30",
    title: "Revision Requested",
    body: (cat) => `Your ${cat} edit needs changes. Check your submissions for admin notes.`,
  },
  rejected: {
    Icon: Ban,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    title: "Submission Rejected",
    body: (cat) => `Your ${cat} submission was rejected. See your submissions for the reason.`,
  },
};

function getSeenSet(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function markSeen(keys: string[]) {
  try {
    const set = getSeenSet();
    keys.forEach((k) => set.add(k));
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(set).slice(-300)));
  } catch {}
}

export function SubmissionNotifier() {
  const [notifs, setNotifs] = useState<NotifItem[]>([]);

  function dismiss(uid: string) {
    setNotifs((prev) => prev.filter((n) => n.uid !== uid));
  }

  function enqueue(items: Omit<NotifItem, "uid">[]) {
    const unseen = items.filter((n) => !getSeenSet().has(n.key));
    if (unseen.length === 0) return;
    markSeen(unseen.map((n) => n.key));
    unseen.forEach((item, i) => {
      const uid = `${item.key}-${Date.now()}-${i}`;
      const notif: NotifItem = { ...item, uid };
      setTimeout(() => {
        setNotifs((prev) => [...prev, notif]);
        setTimeout(() => setNotifs((prev) => prev.filter((n) => n.uid !== uid)), AUTO_DISMISS_MS);
      }, i * 400);
    });
  }

  useEffect(() => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ── 1. Catch up on missed notifications (last 7 days) ──────────────────
      const since = new Date(Date.now() - MAX_AGE_DAYS * 86400_000).toISOString();
      const { data: subs } = await supabase
        .from("submissions")
        .select("id, status, admin_notes, content_style_id")
        .eq("editor_id", user.id)
        .in("status", ["approved", "revision", "rejected"])
        .gte("reviewed_at", since)
        .order("reviewed_at", { ascending: false });

      if (subs && subs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const styleIds = Array.from(new Set((subs as any[]).map((s) => s.content_style_id).filter(Boolean)));
        const { data: styles } = await supabase
          .from("content_styles").select("id, name").in("id", styleIds);
        const styleMap: Record<string, string> = Object.fromEntries(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (styles ?? []).map((s: any) => [s.id, s.name])
        );

        enqueue(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (subs as any[]).map((sub) => ({
            key: `${sub.id}_${sub.status}`,
            type: sub.status as NotifType,
            category: styleMap[sub.content_style_id] ?? "Edit",
            adminNote: sub.admin_notes,
          }))
        );
      }

      // ── 2. Subscribe to live updates ───────────────────────────────────────
      channel = supabase
        .channel("submission-notifier")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "submissions",
            filter: `editor_id=eq.${user.id}`,
          },
          async (payload) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const row = payload.new as any;
            if (!["approved", "revision", "rejected"].includes(row.status)) return;

            let category = "Edit";
            if (row.content_style_id) {
              const { data } = await supabase
                .from("content_styles").select("name").eq("id", row.content_style_id).single();
              if (data) category = data.name;
            }

            enqueue([{
              key: `${row.id}_${row.status}`,
              type: row.status as NotifType,
              category,
              adminNote: row.admin_notes,
            }]);
          }
        )
        .subscribe();
    }

    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (notifs.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-3 md:bottom-6 md:right-5 z-[200] flex flex-col gap-2.5 pointer-events-none w-[calc(100vw-24px)] max-w-sm">
      {notifs.map((notif) => {
        const { Icon, color, bg, border, title, body } = CONFIG[notif.type];
        return (
          <div
            key={notif.uid}
            className={cn(
              "flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md pointer-events-auto",
              "animate-in slide-in-from-right-4 fade-in duration-300",
              bg, border
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
              bg, "ring-1", border
            )}>
              <Icon className={cn("w-4 h-4", color)} />
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold leading-tight", color)}>{title}</p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">{body(notif.category)}</p>
              {notif.adminNote && (notif.type === "rejected" || notif.type === "revision") && (
                <p className={cn(
                  "text-xs mt-1.5 line-clamp-2 italic leading-relaxed",
                  notif.type === "rejected" ? "text-red-300" : "text-accent-orange/80"
                )}>
                  &ldquo;{notif.adminNote}&rdquo;
                </p>
              )}
            </div>

            <button
              onClick={() => dismiss(notif.uid)}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors mt-0.5"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3 text-text-muted" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
