"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clapperboard, Film, Video, Zap, Scissors, Monitor, Smartphone, Play, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const SOFTWARE = [
  { id: "premiere", name: "Premiere Pro", icon: Clapperboard },
  { id: "davinci", name: "DaVinci Resolve", icon: Film },
  { id: "capcut", name: "CapCut", icon: Play },
  { id: "aftereffects", name: "After Effects", icon: Zap },
  { id: "finalcut", name: "Final Cut Pro", icon: Scissors },
  { id: "vegas", name: "Vegas Pro", icon: Monitor },
  { id: "capcutmobile", name: "CapCut Mobile", icon: Smartphone },
  { id: "adoberush", name: "Adobe Rush", icon: Video },
];

export default function Step1() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleContinue() {
    setLoading(true);
    const software = Array.from(selected);
    // Keep in localStorage for step-2 ranking
    localStorage.setItem("edify_software", JSON.stringify(software));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({ id: user.id, editing_software: software }, { onConflict: "id" });
    }
    router.push("/onboarding/step-2");
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
        What tools do you edit with?
      </h1>
      <p className="text-text-secondary text-sm mb-8">Select all the software you use</p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {SOFTWARE.map(({ id, name, icon: Icon }) => {
          const isSelected = selected.has(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={cn(
                "relative flex flex-col items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 bg-surface-raised",
                isSelected ? "border-accent-cyan bg-accent-cyan/5 shadow-glow-cyan" : "border-border hover:border-text-muted"
              )}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent-cyan flex items-center justify-center">
                  <Check className="w-3 h-3 text-background" />
                </span>
              )}
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", isSelected ? "bg-accent-cyan/20" : "bg-surface")}>
                <Icon className={cn("w-5 h-5", isSelected ? "text-accent-cyan" : "text-text-secondary")} />
              </div>
              <span className={cn("text-sm font-medium", isSelected ? "text-text-primary" : "text-text-secondary")}>{name}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleContinue}
        disabled={selected.size === 0 || loading}
        className={cn(
          "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200",
          selected.size > 0 && !loading
            ? "bg-accent-cyan text-background hover:bg-accent-cyan/90 shadow-glow-cyan"
            : "bg-surface-raised text-text-muted cursor-not-allowed"
        )}
      >
        {loading ? "Saving…" : "Continue →"}
      </button>
    </div>
  );
}
