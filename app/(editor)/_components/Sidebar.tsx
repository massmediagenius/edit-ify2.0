"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Megaphone,
  MessageSquare,
  DollarSign,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/assets", icon: FolderOpen, label: "Assets" },
  { href: "/dashboard/brand", icon: Megaphone, label: "Brand" },
  { href: "/dashboard/revisions", icon: MessageSquare, label: "Revisions", badge: 2 },
  { href: "/dashboard/earnings", icon: DollarSign, label: "Earnings" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-surface border-r border-border flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-accent-cyan" />
        </div>
        <span className="font-heading font-bold text-lg text-text-primary">Edify</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
        {NAV.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative",
                active
                  ? "text-accent-cyan bg-accent-cyan/10 border-l-2 border-accent-cyan pl-[10px]"
                  : "text-text-secondary hover:bg-surface-raised hover:text-text-primary border-l-2 border-transparent"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-accent-cyan" : "")} />
              <span className="flex-1">{label}</span>
              {badge !== undefined && (
                <span className="w-5 h-5 rounded-full bg-accent-cyan text-background text-xs font-bold flex items-center justify-center">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center text-xs font-bold text-accent-purple">
          JD
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-text-primary truncate">John Doe</div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-raised text-text-muted font-medium">
            Editor
          </span>
        </div>
      </div>
    </aside>
  );
}
