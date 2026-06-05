"use client";

import { useState } from "react";
import { Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 left-[220px] right-0 h-14 bg-surface border-b border-border z-20 flex items-center justify-between px-6">
      {/* Metric chips */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-4 py-1.5">
          <span className="text-xs text-text-muted">Total Earned</span>
          <span className="text-sm font-bold text-accent-green">$1,250</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-4 py-1.5">
          <span className="text-xs text-text-muted">Pending</span>
          <span className="text-sm font-bold text-accent-orange">$400</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-4 py-1.5">
          <span className="text-xs text-text-muted">Next Payout</span>
          <span className="text-sm font-bold text-accent-cyan">Oct 15</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <button className="relative p-2 rounded-lg hover:bg-surface-raised transition-colors">
          <Bell className="w-4 h-4 text-text-secondary" />
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-cyan text-background text-[9px] font-bold flex items-center justify-center">
            3
          </span>
        </button>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-accent-purple/20 flex items-center justify-center text-xs font-bold text-accent-purple">
              JD
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-text-muted transition-transform", dropdownOpen && "rotate-180")} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-surface-raised border border-border rounded-xl overflow-hidden shadow-lg">
              <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors">
                <User className="w-4 h-4" /> Profile
              </button>
              <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors">
                <Settings className="w-4 h-4" /> Settings
              </button>
              <div className="border-t border-border" />
              <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent-orange hover:bg-surface transition-colors">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
