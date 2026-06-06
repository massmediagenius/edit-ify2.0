"use client";

import { cn } from "@/lib/utils";

type Status = "approved" | "pending" | "revision" | "re-uploaded" | "locked" | "rejected";

const statusConfig: Record<Status, { label: string; bg: string; text: string; extra?: string }> = {
  approved: {
    label: "Approved",
    bg: "bg-accent-green/20",
    text: "text-accent-green",
  },
  pending: {
    label: "Pending",
    bg: "bg-accent-cyan/20",
    text: "text-accent-cyan",
  },
  revision: {
    label: "Revision",
    bg: "bg-accent-orange/20",
    text: "text-accent-orange",
  },
  "re-uploaded": {
    label: "Re-uploaded",
    bg: "bg-accent-orange/20",
    text: "text-accent-orange",
    extra: "animate-pulse",
  },
  locked: {
    label: "Locked",
    bg: "bg-accent-yellow/20",
    text: "text-accent-yellow",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-500/20",
    text: "text-red-400",
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, bg, text, extra } = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        bg,
        text,
        extra,
        className
      )}
    >
      {label}
    </span>
  );
}
