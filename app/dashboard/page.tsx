"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, X, Upload, DollarSign, ChevronRight, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { HelpTip } from "./_components/HelpTip";

type ContentStyle = {
  id: string;
  name: string;
  description: string | null;
  price_per_edit: number;
  level: number;
  gradient_class: string;
  example_video_urls: string[] | null;
  brand_guide_notes: string | null;
};

function StyleModal({ style, onClose }: { style: ContentStyle; onClose: () => void }) {
  const router = useRouter();
  const firstVideo = style.example_video_urls?.[0];
  const moreVideos = style.example_video_urls?.slice(1) ?? [];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Banner — autoplaying first video, gradient fallback */}
        <div className="w-full relative rounded-t-2xl overflow-hidden bg-black">
          {firstVideo ? (
            <div className="w-full h-56">
              <video
                src={firstVideo}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
          ) : (
            <div className={cn("w-full h-56 bg-gradient-to-br flex items-center justify-center", style.gradient_class)}>
              <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-7 h-7 text-white ml-1" />
              </div>
            </div>
          )}
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors z-10">
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="absolute bottom-4 left-4 z-10">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white">Level {style.level}</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-heading text-xl font-bold text-text-primary">{style.name}</h2>
              {style.description && <p className="text-text-secondary text-sm mt-1">{style.description}</p>}
            </div>
            <div className="text-right shrink-0 ml-3">
              <div className="text-2xl font-heading font-bold text-accent-cyan">${style.price_per_edit.toFixed(2)}</div>
              <div className="text-xs text-text-muted">per edit</div>
            </div>
          </div>

          {style.brand_guide_notes && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Style Guide</h3>
              <div className="bg-surface-raised border border-border rounded-xl p-4 text-sm text-text-secondary whitespace-pre-line">
                {style.brand_guide_notes}
              </div>
            </div>
          )}

          {moreVideos.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">More Examples</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {moreVideos.map((url, i) => (
                  <div key={i} className="shrink-0 w-32 aspect-[9/16] bg-black rounded-xl overflow-hidden border border-border">
                    <video src={url} controls className="w-full h-full object-cover" playsInline preload="metadata" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => { onClose(); router.push("/dashboard/upload"); }}
            className="w-full py-3 bg-accent-cyan text-background font-semibold rounded-xl text-sm hover:bg-accent-cyan/90 shadow-glow-cyan transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Submit an Edit for This Style
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [styles, setStyles] = useState<ContentStyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<ContentStyle | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; pending_balance: number; approved_balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const [stylesRes, profileRes] = await Promise.all([
        supabase.from("content_styles").select("*").eq("is_active", true).order("level"),
        user
          ? supabase.from("profiles").select("full_name, pending_balance, approved_balance").eq("id", user.id).single()
          : Promise.resolve({ data: null }),
      ]);

      setStyles(stylesRes.data ?? []);
      setProfile(profileRes.data ?? null);
      setLoading(false);
    }
    load();
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Editor";

  return (
    <>
      {selectedStyle && <StyleModal style={selectedStyle} onClose={() => setSelectedStyle(null)} />}

      <div className="p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-text-primary">
              Welcome back, {firstName}
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Click a content style to see guidelines and submit your edit.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-surface border border-border rounded-xl px-4 py-3 text-right">
              <div className="flex items-center justify-end gap-1 mb-0.5">
                <div className="text-xs text-text-muted">Pending</div>
                <HelpTip side="bottom" content="Edits currently under admin review. Once approved they move to your Available balance." />
              </div>
              <div className="text-lg font-heading font-bold text-accent-orange">
                ${(profile?.pending_balance ?? 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl px-4 py-3 text-right">
              <div className="flex items-center justify-end gap-1 mb-0.5">
                <div className="text-xs text-text-muted">Available</div>
                <HelpTip side="bottom" content="Approved edits ready to cash out. Go to Earnings to request a payout — minimum $50." />
              </div>
              <div className="text-lg font-heading font-bold text-accent-green">
                ${(profile?.approved_balance ?? 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-heading font-semibold text-text-primary">Content Styles & Rates</h2>
            <HelpTip content="Each content style is a different type of video edit with its own pay rate. Click a card to see the brand guide, watch example videos, then go to Submit Edit to upload your finished video." side="right" />
          </div>
          <p className="text-text-secondary text-sm">Each style has its own pay rate, brand guidelines, and example edits.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-52 bg-surface-raised border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : styles.length === 0 ? (
          <div className="text-center py-16 text-text-muted">No content styles available yet — check back soon.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {styles.map((style) => {
              const previewVideo = style.example_video_urls?.[0];
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className="group relative rounded-xl overflow-hidden border border-border hover:border-accent-cyan/40 hover:shadow-glow-cyan transition-all duration-200 text-left bg-surface flex flex-col"
                >
                  {/* Thumbnail — 9:16 vertical if video exists, gradient banner otherwise */}
                  <div className={cn(
                    "relative w-full overflow-hidden bg-black",
                    previewVideo ? "aspect-[9/16]" : "h-36 bg-gradient-to-br"
                  ) + (!previewVideo ? ` ${style.gradient_class}` : "")}>

                    {previewVideo ? (
                      <video
                        src={previewVideo}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        loop
                        preload="metadata"
                        onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }}
                        onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                        onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 1; }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Overlay on hover for video cards */}
                    {previewVideo && (
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Badges */}
                    <span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
                      L{style.level}
                    </span>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <div className="text-white font-heading font-bold text-xs leading-tight">{style.name}</div>
                    </div>
                  </div>

                  {/* Price footer */}
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-accent-cyan" />
                      <span className="text-accent-cyan font-bold text-sm">{style.price_per_edit.toFixed(2)}</span>
                      <span className="text-text-muted text-xs">/ edit</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-cyan transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Earnings Incentive Section */}
        <div className="mt-10 rounded-2xl overflow-hidden border border-accent-green/20 bg-surface relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.07),transparent_60%)] pointer-events-none" />
          <div className="relative p-6">
            <div className="flex flex-col lg:flex-row gap-6">

              {/* Left: Copy + math rows */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-green/15 text-accent-green tracking-wider uppercase">No Limits</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan tracking-wider uppercase">Unlimited Edits</span>
                </div>
                <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
                  Make <span className="text-accent-green">$100</span> today. Make{" "}
                  <span className="text-accent-green">$1,000</span> today.<br />
                  <span className="text-text-secondary font-normal text-base">Your income is entirely in your hands.</span>
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed mb-5">
                  There&apos;s no ceiling on what you can earn here. Every edit you submit is money in your pocket — submit 10 and make $100, submit 100 and make $1,000+. The most active editors earn more than ever before. More edits = more money, every single time.
                </p>

                {/* Visual calculator rows */}
                <div className="space-y-2.5">
                  {[
                    { edits: 5,   label: "Casual",  barW: "10%",  earning: "50+",    barColor: "bg-text-muted" },
                    { edits: 10,  label: "Active",   barW: "22%",  earning: "100+",   barColor: "bg-accent-yellow" },
                    { edits: 25,  label: "Grinder",  barW: "50%",  earning: "250+",   barColor: "bg-accent-orange" },
                    { edits: 50,  label: "Top tier", barW: "80%",  earning: "500+",   barColor: "bg-accent-green" },
                    { edits: 100, label: "Elite",    barW: "100%", earning: "1,000+", barColor: "bg-accent-green" },
                  ].map(({ edits, label, barW, earning, barColor }) => (
                    <div key={edits} className="flex items-center gap-3 text-sm">
                      <span className="text-text-muted text-xs w-14 shrink-0">{edits} edits</span>
                      <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: barW }} />
                      </div>
                      <span className={cn("font-heading font-bold text-sm w-20 text-right shrink-0",
                        edits >= 50 ? "text-accent-green" : edits >= 25 ? "text-accent-orange" : edits >= 10 ? "text-accent-yellow" : "text-text-secondary"
                      )}>${earning}/day</span>
                      <span className="text-text-muted text-xs w-16 shrink-0">{label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-text-muted text-xs mt-3">* Estimates based on ~$10/edit avg. Actual varies by content style.</p>
              </div>

              {/* Right: Stat callouts */}
              <div className="flex flex-row lg:flex-col gap-3 lg:w-44 shrink-0">
                <div className="flex-1 lg:flex-none bg-surface-raised border border-accent-green/20 rounded-xl p-4 text-center">
                  <div className="w-8 h-8 rounded-full bg-accent-green/15 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-4 h-4 text-accent-green" />
                  </div>
                  <div className="font-heading font-bold text-2xl text-accent-green">$0</div>
                  <div className="text-text-muted text-xs mt-0.5">Earning cap</div>
                  <div className="text-text-secondary text-xs mt-1 leading-snug">There is no ceiling</div>
                </div>
                <div className="flex-1 lg:flex-none bg-surface-raised border border-accent-cyan/20 rounded-xl p-4 text-center">
                  <div className="w-8 h-8 rounded-full bg-accent-cyan/10 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-4 h-4 text-accent-cyan" />
                  </div>
                  <div className="font-heading font-bold text-2xl text-accent-cyan">∞</div>
                  <div className="text-text-muted text-xs mt-0.5">Daily edits</div>
                  <div className="text-text-secondary text-xs mt-1 leading-snug">Submit as many as you want</div>
                </div>
              </div>
            </div>

            {/* CTA strip */}
            <div className="mt-5 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link
                href="/dashboard/upload"
                className="flex items-center gap-2 px-5 py-2.5 bg-accent-green text-background font-semibold text-sm rounded-lg hover:bg-accent-green/90 transition-colors shrink-0"
              >
                <Upload className="w-4 h-4" />
                Submit an Edit Now
              </Link>
              <p className="text-text-muted text-xs leading-relaxed">
                Edits are reviewed within 24–48 hours. The faster you submit, the faster you earn. Every approved edit goes straight to your balance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
