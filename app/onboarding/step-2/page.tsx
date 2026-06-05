"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const SOFTWARE_ICONS: Record<string, string> = {
  premiere: "Pr", davinci: "Da", capcut: "Cc", aftereffects: "Ae",
  finalcut: "Fc", vegas: "Vp", capcutmobile: "Cm", adoberush: "Ar",
};
const SOFTWARE_NAMES: Record<string, string> = {
  premiere: "Premiere Pro", davinci: "DaVinci Resolve", capcut: "CapCut",
  aftereffects: "After Effects", finalcut: "Final Cut Pro", vegas: "Vegas Pro",
  capcutmobile: "CapCut Mobile", adoberush: "Adobe Rush",
};

function SortableItem({ id, rank }: { id: string; rank: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border bg-surface-raised transition-all duration-150",
        isDragging ? "border-accent-cyan shadow-glow-cyan scale-[1.02] z-10 relative" : "border-border"
      )}
    >
      <button {...attributes} {...listeners} className="text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing touch-none" aria-label="Drag to reorder">
        <GripVertical className="w-5 h-5" />
      </button>
      <span className="text-text-muted text-sm font-mono w-8">#{rank}</span>
      <div className="w-8 h-8 rounded bg-surface flex items-center justify-center text-xs font-bold text-text-secondary">
        {SOFTWARE_ICONS[id] ?? id.slice(0, 2).toUpperCase()}
      </div>
      <span className="flex-1 text-text-primary text-sm font-medium">{SOFTWARE_NAMES[id] ?? id}</span>
      {rank === 1 && (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan">Most skilled</span>
      )}
    </div>
  );
}

export default function Step2() {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("edify_software");
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch {}
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIdx = prev.indexOf(active.id as string);
        const newIdx = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }

  async function handleContinue() {
    setLoading(true);
    localStorage.setItem("edify_software_ranked", JSON.stringify(items));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Store ranked order back into editing_software (ordered array)
      await supabase.from("profiles").upsert({ id: user.id, editing_software: items }, { onConflict: "id" });
    }
    router.push("/onboarding/step-3");
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">Rank your expertise</h1>
      <p className="text-text-secondary text-sm mb-8">#1 means you&apos;re most confident with it</p>

      {items.length === 0 ? (
        <div className="text-center text-text-muted py-12">No software selected — go back to step 1</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2 mb-8">
              {items.map((id, idx) => <SortableItem key={id} id={id} rank={idx + 1} />)}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <button
        onClick={handleContinue}
        disabled={items.length === 0 || loading}
        className={cn(
          "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200",
          items.length > 0 && !loading
            ? "bg-accent-cyan text-background hover:bg-accent-cyan/90 shadow-glow-cyan"
            : "bg-surface-raised text-text-muted cursor-not-allowed"
        )}
      >
        {loading ? "Saving…" : "Continue →"}
      </button>
    </div>
  );
}
