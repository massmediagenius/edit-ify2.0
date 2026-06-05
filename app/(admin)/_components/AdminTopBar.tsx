"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
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
    <header className="fixed top-0 left-0 md:left-[220px] right-0 h-14 bg-surface border-b border-border z-20 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent("editify:open-admin-nav"))}
        >
          <Menu className="w-5 h-5 text-text-secondary" />
        </button>
        <img src="/editify-logo.svg" alt="Edit-ify" className="h-6 md:hidden" />
        <span className="hidden md:block font-heading font-bold text-text-primary">Admin Command Center</span>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:flex items-center gap-2 bg-surface-raised rounded-lg px-4 py-1.5">
          <span className="text-xs text-text-muted">Pending Review</span>
          <span className="text-sm font-bold text-accent-cyan">{stats.pending}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-surface-raised rounded-lg px-4 py-1.5">
          <span className="text-xs text-text-muted">Approved</span>
          <span className="text-sm font-bold text-accent-green">{stats.approved}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-surface-raised rounded-lg px-4 py-1.5">
          <span className="text-xs text-text-muted">Revisions Out</span>
          <span className="text-sm font-bold text-accent-orange">{stats.revision}</span>
        </div>
        <div className="flex md:hidden items-center gap-2">
          <span className="text-xs font-bold text-accent-cyan">{stats.pending} pending</span>
          {stats.revision > 0 && (
            <span className="text-xs font-bold text-accent-orange">{stats.revision} rev</span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-accent-orange hover:bg-surface-raised transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
