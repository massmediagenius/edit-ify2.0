"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const STYLES = [
  { id: "podcast", name: "Podcast Clips", level: "Level 1", price: "$10 / edit", gradient: "from-purple-600 to-cyan-500" },
  { id: "talking", name: "Talking Head Videos", level: "Level 2", price: "$15 / edit", gradient: "from-cyan-500 to-blue-600" },
  { id: "glowup", name: "Glow Up / Before & After", level: "Level 1", price: "$5 / edit", gradient: "from-orange-500 to-yellow-500" },
  { id: "broll", name: "B-Roll Cinematic", level: "Level 2", price: "$12 / edit", gradient: "from-green-500 to-teal-500" },
  { id: "raw", name: "Raw Phone Content", level: "Level 1", price: "$8 / edit", gradient: "from-red-500 to-orange-500" },
];

export default function Step3() {
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
    const styles = Array.from(selected);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({ id: user.id, content_style_prefs: styles }, { onConflict: "id" });
    }
    router.push("/onboarding/step-4");
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
        What styles do you edit best?
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        Select all that apply — you can always change this later
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {STYLES.map((style) => {
          const isSelected = selected.has(style.id);
          return (
            <button
              key={style.id}
              onClick={() => toggle(style.id)}
              className={cn(
                "relative rounded-xl overflow-hidden border-2 text-left transition-all duration-200",
                isSelected ? "border-accent-cyan shadow-glow-cyan" : "border-border hover:border-text-muted"
              )}
            >
              <div className={cn("w-full h-36 bg-gradient-to-br relative", style.gradient)}>
                <span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
                  {style.level}
                </span>
                {isSelected && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent-cyan flex items-center justify-center z-10">
                    <Check className="w-3.5 h-3.5 text-background" />
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={cn("w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-transform duration-200", isSelected && "scale-110")}>
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="bg-surface-raised p-3">
                <div className="font-heading font-bold text-text-primary text-sm">{style.name}</div>
                <div className="text-text-muted text-xs mt-0.5">{style.price}</div>
              </div>
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
