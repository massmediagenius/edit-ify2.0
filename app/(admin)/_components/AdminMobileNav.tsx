"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Grid, FolderOpen, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/queue", icon: ListChecks, label: "Queue" },
  { href: "/admin/library", icon: Grid, label: "Library" },
  { href: "/admin/assets", icon: FolderOpen, label: "Assets" },
  { href: "/admin/editors", icon: Users, label: "Editors" },
  { href: "/admin/payouts", icon: CreditCard, label: "Payouts" },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex items-center">
      {TABS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
              active ? "text-accent-orange" : "text-text-muted"
            )}
          >
            <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_rgba(249,115,22,0.7)]")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
