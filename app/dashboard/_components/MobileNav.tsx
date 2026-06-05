"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, FolderOpen, MessageSquare, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/upload", icon: Upload, label: "Submit" },
  { href: "/dashboard/assets", icon: FolderOpen, label: "Assets" },
  { href: "/dashboard/revisions", icon: MessageSquare, label: "Submissions" },
  { href: "/dashboard/earnings", icon: DollarSign, label: "Earnings" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border flex items-stretch safe-area-bottom">
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors",
              active ? "text-accent-cyan" : "text-text-muted"
            )}
          >
            <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_rgba(0,229,255,0.5)]")} />
            <span className={cn("text-[10px] font-medium leading-none", active ? "text-accent-cyan" : "text-text-muted")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
