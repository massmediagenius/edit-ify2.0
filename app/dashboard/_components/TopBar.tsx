"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function TopBar() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; pending_balance: number; approved_balance: number; total_earned: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name, pending_balance, approved_balance, total_earned").eq("id", user.id).single();
      setProfile(data);
    }
    load();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header className="fixed top-0 left-[220px] right-0 h-14 bg-surface border-b border-border z-20 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-4 py-1.5">
          <span className="text-xs text-text-muted">Total Earned</span>
          <span className="text-sm font-bold text-accent-green">${(profile?.total_earned ?? 0).toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-4 py-1.5">
          <span className="text-xs text-text-muted">Pending</span>
          <span className="text-sm font-bold text-accent-orange">${(profile?.pending_balance ?? 0).toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-4 py-1.5">
          <span className="text-xs text-text-muted">Available</span>
          <span className="text-sm font-bold text-accent-cyan">${(profile?.approved_balance ?? 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-surface-raised transition-colors">
          <Bell className="w-4 h-4 text-text-secondary" />
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-accent-purple/20 flex items-center justify-center text-xs font-bold text-accent-purple">
              {initials}
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-text-muted transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-surface-raised border border-border rounded-xl overflow-hidden shadow-lg z-20">
                <Link href="/dashboard/settings" onClick={() => setOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <Link href="/dashboard/settings" onClick={() => setOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <div className="border-t border-border" />
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent-orange hover:bg-surface transition-colors">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
