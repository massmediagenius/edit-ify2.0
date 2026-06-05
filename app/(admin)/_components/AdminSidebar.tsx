"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Grid, FolderOpen, Users, Tag, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/queue", icon: ListChecks, label: "Queue" },
  { href: "/admin/library", icon: Grid, label: "Library" },
  { href: "/admin/assets", icon: FolderOpen, label: "Assets" },
  { href: "/admin/editors", icon: Users, label: "Editors" },
  { href: "/admin/categories", icon: Tag, label: "Categories" },
  { href: "/admin/payouts", icon: CreditCard, label: "Payouts" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-surface border-r border-border border-t-2 border-t-accent-orange flex flex-col z-20">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <img src="/editify-logo.svg" alt="Edit-ify" className="h-7" />
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent-orange/15 text-accent-orange shrink-0">
          Admin
        </span>
      </div>

      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href);
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
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent-orange/20 flex items-center justify-center text-xs font-bold text-accent-orange">
          SA
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-text-primary truncate">Super Admin</div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-raised text-accent-orange font-medium">
            Admin
          </span>
        </div>
      </div>
    </aside>
  );
}
