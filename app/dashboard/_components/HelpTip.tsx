"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpTipProps {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  width?: string;
  className?: string;
}

export function HelpTip({ content, side = "top", width = "w-64", className }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={cn(
          "w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-colors",
          open
            ? "border-accent-cyan/60 bg-accent-cyan/10 text-accent-cyan"
            : "border-border bg-surface-raised text-text-muted hover:text-accent-cyan hover:border-accent-cyan/40"
        )}
        aria-label="More info"
      >
        <HelpCircle className="w-3 h-3" />
      </button>

      {open && (
        <div className={cn(
          "absolute z-40 bg-surface-raised border border-border rounded-xl p-3 shadow-xl text-xs text-text-secondary leading-relaxed",
          width,
          side === "top" && "bottom-full mb-2 left-1/2 -translate-x-1/2",
          side === "bottom" && "top-full mt-2 left-1/2 -translate-x-1/2",
          side === "right" && "left-full ml-2 top-1/2 -translate-y-1/2",
          side === "left" && "right-full mr-2 top-1/2 -translate-y-1/2",
        )}>
          {content}
        </div>
      )}
    </div>
  );
}
