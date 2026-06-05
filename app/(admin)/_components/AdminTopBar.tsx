"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AdminTopBar() {
  const router = useRouter();
  const [stats, setStats] = useState({ pending: 0, approved: 0, revision: 0 });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("submissions").select("status");
      if (!data) return;
      setStats({
        pending: data.filter((r) => r.status === "pending" || r.status === "re-uploaded").length,
        approved: data.filter((r) => r.status === "approved").length,
        revision: data.filter((r) => r.status === "revision").length,
      });
    }
    load();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="fixed top-0 left-[220px] right-0 h-14 bg-surface border-b border-border z-20 flex items-center justify-between px-6">
      <span className="font-heading font-bold text-text-primary">Admin Command Center</span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-4 py-1.5">
          <span className="text-xs text-text-muted">Pending Review</span>
          <span className="text-sm font-bold text-accent-cyan">{stats.pending}</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-4 py-1.5">
          <span className="text-xs text-text-muted">Approved</span>
          <span className="text-sm font-bold text-accent-green">{stats.approved}</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-4 py-1.5">
          <span className="text-xs text-text-muted">Revisions Out</span>
          <span className="text-sm font-bold text-accent-orange">{stats.revision}</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-accent-orange hover:bg-surface-raised transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
