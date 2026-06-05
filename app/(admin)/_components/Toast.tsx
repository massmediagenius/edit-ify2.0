"use client";

import { useState, useCallback } from "react";
import { Check, X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ICONS = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: "border-accent-green/40 bg-accent-green/10 text-accent-green",
  error:   "border-red-500/40 bg-red-500/10 text-red-400",
  warning: "border-accent-orange/40 bg-accent-orange/10 text-accent-orange",
  info:    "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan",
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return { toasts, toast };
}

export function Toaster({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium backdrop-blur-sm pointer-events-auto",
              "animate-in slide-in-from-right-4 fade-in duration-200",
              STYLES[t.type]
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
