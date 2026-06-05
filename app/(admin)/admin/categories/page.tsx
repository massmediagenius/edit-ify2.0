"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Edit2, Plus, Upload, X, Film } from "lucide-react";
import { CinemaModal } from "@/components/ui/CinemaModal";
import { useToast, Toaster } from "@/app/(admin)/_components/Toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  description: string | null;
  level: 1 | 2 | 3;
  price_per_edit: number;
  is_active: boolean;
  gradient_class: string;
  example_video_urls: string[] | null;
  brand_guide_notes: string | null;
};

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn("relative w-9 h-5 rounded-full transition-colors duration-200", checked ? "bg-accent-cyan" : "bg-border")}
      style={{ minWidth: "36px" }}
    >
      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200", checked ? "translate-x-4" : "translate-x-0.5")} />
    </button>
  );
}

function InlinePrice({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-sm text-text-primary hover:text-accent-cyan transition-colors font-mono">
        ${value.toFixed(2)}
      </button>
    );
  }
  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") { onSave(parseFloat(draft) || value); setEditing(false); }
        if (e.key === "Escape") setEditing(false);
      }}
      onBlur={() => { onSave(parseFloat(draft) || value); setEditing(false); }}
      className="w-20 bg-surface border border-accent-cyan rounded px-2 py-0.5 text-sm text-text-primary font-mono focus:outline-none"
    />
  );
}

const LEVEL_LABELS = { 1: "Entry", 2: "Mid", 3: "Premium" };
const GRADIENT_OPTIONS = [
  "from-purple-500/20 to-pink-500/20",
  "from-cyan-500/20 to-blue-500/20",
  "from-orange-500/20 to-yellow-500/20",
  "from-green-500/20 to-teal-500/20",
  "from-red-500/20 to-orange-500/20",
];

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", level: 1 as 1 | 2 | 3, gradient: GRADIENT_OPTIONS[0], brandGuide: "" });
  const [exampleVideos, setExampleVideos] = useState<string[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toasts, toast } = useToast();

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("content_styles").select("*").order("level");
    setCats((data as unknown as Category[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditingCat(null);
    setForm({ name: "", description: "", price: "", level: 1, gradient: GRADIENT_OPTIONS[0], brandGuide: "" });
    setExampleVideos([]);
    setShowModal(true);
  }

  function openEdit(cat: Category) {
    setEditingCat(cat);
    setForm({ name: cat.name, description: cat.description ?? "", price: String(cat.price_per_edit), level: cat.level, gradient: cat.gradient_class, brandGuide: cat.brand_guide_notes ?? "" });
    setExampleVideos(cat.example_video_urls ?? []);
    setShowModal(true);
  }

  async function handleUploadVideo(file: File) {
    if (!editingCat && !form.name) { toast("Save the category first before adding videos.", "warning"); return; }
    setUploadingVideo(true);
    const supabase = createClient();
    const styleId = editingCat?.id ?? "new";
    const path = `examples/${styleId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("assets").upload(path, file, { upsert: false });
    if (error) { toast(`Upload failed: ${error.message}`, "error"); setUploadingVideo(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(path);
    const updated = [...exampleVideos, publicUrl];
    setExampleVideos(updated);
    if (editingCat) {
      await supabase.from("content_styles").update({ example_video_urls: updated }).eq("id", editingCat.id);
    }
    toast("Video uploaded.", "success");
    setUploadingVideo(false);
  }

  async function removeVideo(url: string) {
    const updated = exampleVideos.filter(v => v !== url);
    setExampleVideos(updated);
    if (editingCat) {
      const supabase = createClient();
      await supabase.from("content_styles").update({ example_video_urls: updated }).eq("id", editingCat.id);
    }
  }

  async function handleSave() {
    const supabase = createClient();
    const payload = {
      name: form.name,
      description: form.description,
      price_per_edit: parseFloat(form.price) || 0,
      level: form.level,
      gradient_class: form.gradient,
      brand_guide_notes: form.brandGuide || null,
      example_video_urls: exampleVideos.length > 0 ? exampleVideos : null,
    };

    if (editingCat) {
      const { error } = await supabase.from("content_styles").update(payload).eq("id", editingCat.id);
      if (error) { toast(error.message, "error"); return; }
      toast("Category updated.", "success");
    } else {
      const { error } = await supabase.from("content_styles").insert({ ...payload, is_active: true });
      if (error) { toast(error.message, "error"); return; }
      toast("Category created.", "success");
    }

    setShowModal(false);
    load();
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("content_styles").update({ is_active: !current }).eq("id", id);
    setCats((prev) => prev.map((c) => c.id === id ? { ...c, is_active: !current } : c));
  }

  async function updatePrice(id: string, price: number) {
    const supabase = createClient();
    await supabase.from("content_styles").update({ price_per_edit: price }).eq("id", id);
    setCats((prev) => prev.map((c) => c.id === id ? { ...c, price_per_edit: price } : c));
    toast("Price updated.", "success");
  }

  return (
    <div className="p-6">
      <CinemaModal open={showModal} onClose={() => setShowModal(false)} className="max-w-md">
        <div className="p-6">
          <h2 className="font-heading text-lg font-bold text-text-primary mb-4">{editingCat ? "Edit Category" : "Add Category"}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-cyan" placeholder="e.g. Podcast Clips" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Description</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-cyan" placeholder="Short description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Price / Edit ($)</label>
                <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-cyan" placeholder="10.00" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Level</label>
                <div className="flex gap-1">
                  {([1, 2, 3] as const).map((l) => (
                    <button key={l} onClick={() => setForm((f) => ({ ...f, level: l }))}
                      className={cn("flex-1 py-2 rounded-lg text-xs font-medium border transition-colors",
                        form.level === l ? "border-accent-cyan bg-accent-cyan/10 text-accent-cyan" : "border-border text-text-muted hover:border-text-muted")}>
                      L{l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Brand guide notes */}
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Brand Guide / Instructions (shown to editors)</label>
              <textarea
                value={form.brandGuide}
                onChange={(e) => setForm(f => ({ ...f, brandGuide: e.target.value }))}
                rows={3}
                placeholder="e.g. Use cyan accent color, keep transitions under 0.5s..."
                className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan resize-none"
              />
            </div>

            {/* Example videos */}
            <div>
              <label className="block text-xs text-text-secondary mb-2">Example Videos (9:16 vertical)</label>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  for (const f of files) await handleUploadVideo(f);
                  e.target.value = "";
                }}
              />
              {exampleVideos.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {exampleVideos.map((url, i) => (
                    <div key={i} className="relative w-16 rounded-lg overflow-hidden border border-border bg-surface-raised">
                      <video src={url} className="w-full aspect-[9/16] object-cover" muted preload="metadata"
                        onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }} />
                      <button
                        onClick={() => removeVideo(url)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                      <div className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] text-white bg-black/50">
                        {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={uploadingVideo}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-border rounded-xl text-xs text-text-muted hover:border-accent-cyan hover:text-accent-cyan transition-colors disabled:opacity-50"
              >
                {uploadingVideo ? (
                  <><Film className="w-4 h-4 animate-pulse" /> Uploading…</>
                ) : (
                  <><Upload className="w-4 h-4" /> Upload example videos</>
                )}
              </button>
            </div>

            <div className="flex gap-2 mt-2">
              <button onClick={handleSave} className="flex-1 py-2.5 bg-accent-cyan text-background font-semibold rounded-xl text-sm hover:bg-accent-cyan/90 transition-colors">
                {editingCat ? "Save Changes" : "Create Category"}
              </button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-border text-text-secondary rounded-xl text-sm hover:text-text-primary transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </CinemaModal>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-xl font-bold text-text-primary">Content Styles & Pricing</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-accent-cyan text-background font-semibold rounded-lg text-sm hover:bg-accent-cyan/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Name", "Level", "Price / Edit", "Active", "Edit"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-text-muted">Loading…</td></tr>
            ) : cats.map((cat) => (
              <tr key={cat.id} className="border-b border-border/50 last:border-0 hover:bg-surface-raised transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br", cat.gradient_class)} />
                    <div>
                      <div className="text-sm font-medium text-text-primary">{cat.name}</div>
                      {cat.description && <div className="text-xs text-text-muted truncate max-w-[200px]">{cat.description}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-raised text-text-secondary font-medium">
                    {LEVEL_LABELS[cat.level]} (L{cat.level})
                  </span>
                </td>
                <td className="px-5 py-3">
                  <InlinePrice value={cat.price_per_edit} onSave={(v) => updatePrice(cat.id, v)} />
                </td>
                <td className="px-5 py-3">
                  <Switch checked={cat.is_active} onChange={() => toggleActive(cat.id, cat.is_active)} />
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => openEdit(cat)} className="text-text-muted hover:text-accent-cyan transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Toaster toasts={toasts} />
    </div>
  );
}
