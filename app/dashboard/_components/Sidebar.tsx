"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, FolderOpen, Megaphone, MessageSquare,
  DollarSign, Settings, Upload, LogOut, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/upload", icon: Upload, label: "Submit Edit" },
  { href: "/dashboard/assets", icon: FolderOpen, label: "Assets" },
  { href: "/dashboard/brand", icon: Megaphone, label: "Brand" },
  { href: "/dashboard/revisions", icon: MessageSquare, label: "My Submissions" },
  { href: "/dashboard/earnings", icon: DollarSign, label: "Earnings" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
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
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-surface border-r border-border flex flex-col z-20">
      <div className="flex items-center px-5 py-4 border-b border-border">
        <img src="/editify-logo.svg" alt="Edit-ify" className="h-7" />
      </div>

      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border-l-2",
                active
                  ? "text-accent-cyan bg-accent-cyan/10 border-accent-cyan pl-[10px] pr-3"
                  : "text-text-secondary hover:bg-surface-raised hover:text-text-primary border-transparent px-3"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-accent-cyan" : "")} />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center text-xs font-bold text-accent-purple">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-text-primary truncate">{profile?.full_name ?? "Editor"}</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-raised text-text-muted font-medium">Editor</span>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("editify:start-tour"))}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-accent-cyan hover:bg-surface-raised transition-colors mb-1"
        >
          <HelpCircle className="w-4 h-4" />
          Platform Tour
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-accent-orange hover:bg-surface-raised transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
