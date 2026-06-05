"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
}

export function GlowCard({ children, className, glow = true, ...props }: GlowCardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-xl overflow-hidden",
        "transition-all duration-300 ease-out",
        glow && "hover:-translate-y-1 hover:shadow-glow-cyan hover:border-accent-cyan/40",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
