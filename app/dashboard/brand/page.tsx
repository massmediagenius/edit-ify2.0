"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, FolderOpen, ChevronRight, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";

const PRINCIPLES = [
  { label: "Discipline > Motivation", desc: "Show up every day — not just when it feels good. Discipline is what replaced his addiction." },
  { label: "Faith = Structure", desc: "God isn't a soft concept here. Faith gave David a blueprint when nothing else could." },
  { label: "Legacy > Luxury", desc: "Build for your kids and their kids. Not for clout, cars, or attention." },
  { label: "Loyalty Is Priceless", desc: "Proven in hard times, not good ones. This is non-negotiable in his world." },
  { label: "Comfort Is the Enemy", desc: "Growth only comes from pressure. Comfort is where potential goes to die." },
  { label: "Family Is Power", desc: "His wife Karen, son Dylan, daughter Haley, Aunt Kim — they run the empire together. Family first, always." },
  { label: "Pain Is a Gift", desc: "Facing charges at 18, battling addiction, and enduring loss forged his character. His scars are his credibility." },
  { label: "Peace > Money", desc: "True success is waking up free, surrounded by people who love you. Not a number in a bank account." },
];

const CONTENT_TYPES = [
  {
    id: "glow-up",
    color: "border-accent-purple",
    accent: "text-accent-purple",
    bg: "bg-accent-purple/10",
    title: "Glow Up",
    tagline: "Before → After. Chaos → Empire.",
    desc: "This is David's core arc and the most powerful content type. The story goes: broke, addicted, facing murder charges at 18, hopeless → disciplined, faith-led, running an 8-figure family empire. The contrast IS the content.",
    rules: [
      "Open with the 'before' — raw, dark, heavy. Don't sanitize it. Prison, addiction, poverty.",
      "The turning point is the emotional anchor — use it deliberately (a quote, a beat drop, a text overlay).",
      "Close with the 'after' — lifestyle, family, empire, peace. Let it breathe.",
      "Sound design matters most here. Use trending 'before/after' sounds but tailor them to his story, not generic hype.",
      "Text overlays should match his voice: 'From facing charges at 18 to building an empire.' Short. Blunt. Real.",
      "This is the Glow Up content style — use Old Pics of David + Private Jet + B-Roll folders for the visual arc.",
    ],
  },
  {
    id: "talking-head",
    color: "border-accent-cyan",
    accent: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    title: "Talking Head",
    tagline: "Direct. No fluff. Eye to eye.",
    desc: "David speaks directly to camera with calm storm energy. No performance. No hype. He's not motivating you — he's telling you the truth and daring you to hear it. Your job is to keep the viewer locked in every second.",
    rules: [
      "Hook in the first 1–2 seconds. Use his sharpest line from the clip, not the setup.",
      "Cut dead air ruthlessly. Emphatic pauses are gold — but awkward gaps kill retention.",
      "B-roll layering: use the B-Roll folder to cut away at lifestyle shots during monologue. Don't just sit on his face the whole time.",
      "Captions are mandatory. Match his rhythm — don't auto-fill every word at the same size.",
      "Highlight key phrases in captions: bold or colored text on 'Stay Anchored', 'Legacy over luxury', 'Ten toes down'.",
      "End on a mic-drop. Cut before it gets soft. Always close with 'Stay Anchored.' or his sign-off.",
    ],
  },
  {
    id: "podcast",
    color: "border-accent-green",
    accent: "text-accent-green",
    bg: "bg-accent-green/10",
    title: "Podcast Clips",
    tagline: "Find the peak moments. Cut everything else.",
    desc: "Podcast recordings are long-form gold — but only if you extract the right moments. You're looking for emotional peaks: a revelation, a raw confession, a truth bomb, a laugh that breaks the tension. The story still applies — find clips that show redemption, discipline, or loyalty in action.",
    rules: [
      "Don't start the clip at the beginning of an answer — start where the energy spikes.",
      "Multi-speaker clips: keep the conversation flow but cut the fat. Never let energy dip below baseline.",
      "Add B-roll cutaways when David is referencing a story (his house arrest, his family, his warehouse).",
      "Lower thirds or name titles if it's a notable guest — always confirm the name spelling before adding it.",
      "Captions are non-negotiable. Podcast clips get watched on mute more than any other format.",
      "Close with a hook caption or title card: 'Full episode linked in bio.' Keep them wanting more.",
    ],
  },
  {
    id: "b-roll",
    color: "border-accent-orange",
    accent: "text-accent-orange",
    bg: "bg-accent-orange/10",
    title: "B-Roll & Lifestyle",
    tagline: "The empire in motion. No words needed.",
    desc: "B-Roll shows the proof. David doesn't just talk about discipline and legacy — you can see it in the warehouse, the cars, the family moments, the morning routines. B-Roll edits are pure atmosphere: no talking, just visual storytelling layered with music that hits.",
    rules: [
      "Music selection is everything. It should feel cinematic, not club. Think moody trap, gospel-influenced beats, or orchestral builds.",
      "Golden hour and natural light are the target aesthetic. Avoid flat midday lighting.",
      "Pace your cuts to the beat, but don't be predictable. Let a long cinematic shot breathe before the next cut.",
      "Sequence matters: open with something commanding (David walking, wide shot of warehouse), build through middle, close on family or faith moment.",
      "Color grade: moody, rich tones. Slightly desaturated with warm highlights. Not oversaturated Instagram edits.",
      "These clips live in the B-Roll and Raw folders — also check Private Jet and Las Vegas w/Steve for lifestyle shots.",
    ],
  },
  {
    id: "anchored-thoughts",
    color: "border-accent-yellow",
    accent: "text-accent-yellow",
    bg: "bg-accent-yellow/10",
    title: "Anchored Thoughts",
    tagline: "30–60 seconds. One truth. Maximum impact.",
    desc: "Short punchy wisdom drops built around a single principle. No rambling, no setup — just the lesson, delivered with authority. These are the most shareable format in his library and the easiest to syndicate across clip accounts.",
    rules: [
      "One theme per clip: discipline, faith, loyalty, legacy, or family. Never mix.",
      "The hook is the entire edit. If the first line doesn't stop the scroll, nothing after it matters.",
      "Keep it under 60 seconds. If it runs long, cut it harder.",
      "Minimal visual cuts — let David's energy carry it. A slow zoom or single B-roll cutaway is enough.",
      "Bold text overlays on the key line. That's the shareable moment — make it readable.",
      "These end with 'Stay Anchored.' Every time. No exceptions.",
    ],
  },
];

const FOLDERS = [
  {
    name: "Talking Videos",
    color: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    border: "border-accent-cyan/20",
    what: "Direct-to-camera monologues and motivational speeches from David.",
    lookFor: "Intense eye contact, powerful pauses, lines like 'Stay Anchored' or 'Ten toes down.' These are your primary source for Talking Head and Anchored Thought content types.",
  },
  {
    name: "B-roll",
    color: "text-accent-purple",
    bg: "bg-accent-purple/10",
    border: "border-accent-purple/20",
    what: "Lifestyle and cinematic footage: warehouse operations, cars, morning routines, family moments.",
    lookFor: "Golden hour light, wide establishing shots, detail shots (hands, products, environments). Layer this over talking clips or use standalone for atmospheric edits.",
  },
  {
    name: "Podcast",
    color: "text-accent-green",
    bg: "bg-accent-green/10",
    border: "border-accent-green/20",
    what: "Full podcast recordings featuring David and his guests.",
    lookFor: "Emotional peaks, truth bombs, story moments. Scan for when his tone shifts — that's usually the gold. Also note: guest names need lower-third titles.",
  },
  {
    name: "Raw",
    color: "text-accent-orange",
    bg: "bg-accent-orange/10",
    border: "border-accent-orange/20",
    what: "Unpolished, behind-the-scenes, phone-shot footage. This is the 'real' stuff.",
    lookFor: "Spontaneous moments, candid family interactions, unfiltered energy. Raw footage lends credibility — it shows the man, not the brand. Handle it with respect.",
  },
  {
    name: "Private Jet",
    color: "text-accent-yellow",
    bg: "bg-accent-yellow/10",
    border: "border-accent-yellow/20",
    what: "Footage of David on private jets — a symbol of the empire he built.",
    lookFor: "Aspirational shots that communicate the 'after' story. Use in Glow Up transitions to contrast the before (old pics, raw struggle footage) with the after (this). Don't overuse — keep it earned.",
  },
  {
    name: "Las Vegas w/Steve",
    color: "text-accent-purple",
    bg: "bg-accent-purple/10",
    border: "border-accent-purple/20",
    what: "Event and trip footage from Las Vegas with Steve — lifestyle, networking, high-energy social moments.",
    lookFor: "Energy, connection, social proof of his world. Great for B-Roll lifestyle segments or context clips showing David in his element outside of work mode.",
  },
  {
    name: "Old Pics of David",
    color: "text-text-muted",
    bg: "bg-surface-raised",
    border: "border-border",
    what: "Archive photos and footage from David's earlier life — before the transformation.",
    lookFor: "The 'before' in every Glow Up edit lives here. Use carefully and respectfully — these images carry emotional weight. They're not for shock value; they're proof that redemption is real. Always pair with the 'after' story.",
  },
];

const NEVER_ACCEPT = [
  "Edits that make David look soft, clout-chasing, or performative — that's the opposite of his brand.",
  "Oversaturated Instagram color grades. His aesthetic is moody, rich, and cinematic — not filter-heavy.",
  "Starting a clip on a weak line. The first second must hook. If it doesn't, find a better entry point.",
  "Blurry, out-of-focus, or poorly lit footage submitted as final work.",
  "Watermarks from any editing software (CapCut, DaVinci, etc.).",
  "Lip sync issues on any talking head or podcast clip.",
  "Missing captions. Every talking video needs captions — non-negotiable.",
  "Exports under 1080p resolution.",
  "Edits that don't end on a strong note. His content always closes with intention.",
];

export default function BrandPage() {
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    function handleScroll() { setShowCTA(window.scrollY > 300); }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="max-w-3xl mx-auto pb-28 px-6 pt-8">

      {/* ── Hero ── */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Anchor className="w-5 h-5 text-accent-cyan" />
          <span className="text-xs font-bold uppercase tracking-widest text-accent-cyan">Editor Brand Guide</span>
        </div>
        <h1 className="font-heading text-4xl font-extrabold mb-4 bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-green bg-clip-text text-transparent leading-tight">
          David Saylor — The Full Picture
        </h1>
        <p className="text-text-secondary text-base leading-relaxed mb-6">
          Before you cut a single frame, you need to understand who this man is, where he came from, and what this content is actually doing in the world. Read this once. Then read it again. Your edits will be better for it.
        </p>
        <blockquote className="bg-surface border-l-4 border-accent-cyan rounded-r-xl px-5 py-4 text-text-primary text-sm italic">
          &ldquo;Does this content show David as a man of faith, discipline, loyalty, and legacy — a Southern alpha who built an empire from nothing? If not, go back and fix it.&rdquo;
        </blockquote>
      </div>

      {/* ── The Story ── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold text-text-primary mb-1 pl-4 border-l-2 border-accent-purple">
          The Story You&apos;re Telling
        </h2>
        <p className="text-text-muted text-xs mb-5 pl-4">Know this cold. Every piece of content lives inside this arc.</p>

        <div className="space-y-3">
          {/* Before */}
          <div className="bg-surface border border-border rounded-xl p-5 border-l-4 border-l-red-500/60">
            <div className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">The Before</div>
            <p className="text-text-secondary text-sm leading-relaxed">
              Grew up in the South surrounded by poverty, violence, and broken role models. Dropped out of school in 8th grade. By 16, he was deep in the streets. At <span className="text-text-primary font-semibold">18 years old, he was facing murder charges</span> — sentenced to 2 years of house arrest and 10 years of probation. During that time: drug addiction, depression, hopelessness, betrayal, and the loss of people he trusted. This is the raw material of every Glow Up edit.
            </p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center py-1">
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-5 bg-border" />
              <div className="text-xs font-bold text-accent-cyan tracking-widest uppercase">The Turning Point</div>
              <div className="w-px h-5 bg-border" />
            </div>
          </div>

          {/* Turning Point */}
          <div className="bg-surface border border-border rounded-xl p-5 border-l-4 border-l-accent-cyan">
            <div className="text-xs font-bold uppercase tracking-widest text-accent-cyan mb-2">The Crucible</div>
            <p className="text-text-secondary text-sm leading-relaxed">
              In the silence of house arrest, something shifted. David found <span className="text-text-primary font-semibold">God, faith, and structure</span>. He started journaling, praying, and reflecting. He realized motivation fades — but <span className="text-text-primary font-semibold">discipline lasts</span>. This is where the man was built. Not in success, but in confinement. Not with support, but with pressure.
            </p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center py-1">
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-5 bg-border" />
              <div className="text-xs font-bold text-accent-green tracking-widest uppercase">The After</div>
              <div className="w-px h-5 bg-border" />
            </div>
          </div>

          {/* After */}
          <div className="bg-surface border border-border rounded-xl p-5 border-l-4 border-l-accent-green">
            <div className="text-xs font-bold uppercase tracking-widest text-accent-green mb-2">The Empire</div>
            <p className="text-text-secondary text-sm leading-relaxed">
              Today David runs a <span className="text-text-primary font-semibold">multi-8-figure family empire</span>: ALTRD and MOTION. His wife Karen is CFO. His son Dylan and daughter Haley co-own storefronts. He built everything on faith, discipline, and loyalty — and his family runs it with him. <span className="text-text-primary font-semibold">This is the glow-up. This is what the content proves.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Brand Voice ── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold text-text-primary mb-1 pl-4 border-l-2 border-accent-cyan">
          His Voice. Learn It.
        </h2>
        <p className="text-text-muted text-xs mb-5 pl-4">Your captions and text overlays need to sound like him — not like a generic motivational account.</p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Pace", value: "Deliberate. Commanding. Calm storm energy." },
            { label: "Delivery", value: "Truth-telling, not preaching. Alpha presence. Never performative." },
            { label: "Style", value: "Southern alpha meets spiritual warrior. Gritty but grounded. No fluff." },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-4">
              <div className="text-xs font-bold text-accent-cyan uppercase tracking-wider mb-2">{label}</div>
              <p className="text-text-secondary text-xs leading-relaxed">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-xs font-bold text-accent-cyan uppercase tracking-wider mb-3">Key Phrases — Use These in Captions & Overlays</div>
          <div className="flex flex-wrap gap-2">
            {[
              "Stay Anchored.",
              "Ten toes down.",
              "Legacy over luxury.",
              "I stand on that.",
              "Built different.",
              "You fold under pressure, you were never real.",
              "Wired tighter, led by faith.",
              "This ain't no brand. This is blood.",
              "Don't chase clout. Chase what lasts.",
              "Faith > Fear.",
            ].map((phrase) => (
              <span key={phrase} className="text-xs px-3 py-1.5 rounded-full bg-surface-raised border border-border text-text-secondary font-medium">
                &ldquo;{phrase}&rdquo;
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Narrative Positioning ── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold text-text-primary mb-1 pl-4 border-l-2 border-accent-purple">
          The Narrative: Who He&apos;s For & What He&apos;s Against
        </h2>
        <p className="text-text-muted text-xs mb-5 pl-4">David&apos;s content has a clear protagonist and a clear antagonist. Know the difference.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-accent-green mb-3">He Speaks FOR</div>
            <ul className="space-y-2">
              {["Faith and structure as weapons", "Discipline over motivation", "Family as the real flex", "Legacy built for generations", "Loyalty tested in hard times", "Men who lead with a moral code", "People fighting their way out of chaos"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-text-secondary">
                  <Check className="w-3.5 h-3.5 text-accent-green shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-accent-orange mb-3">He Speaks AGAINST</div>
            <ul className="space-y-2">
              {["Men with no honor or code", "Clout-chasers and fake hustlers", "Comfort and ego-driven culture", "Followers pretending to lead", "Chasing flash over legacy", "Weakness disguised as peace", "Living without discipline or purpose"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-text-secondary">
                  <X className="w-3.5 h-3.5 text-accent-orange shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Core Principles ── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold text-text-primary mb-1 pl-4 border-l-2 border-accent-cyan">
          Core Principles
        </h2>
        <p className="text-text-muted text-xs mb-5 pl-4">These eight beliefs show up in everything he says. Know them so your edits reinforce them, never accidentally undercut them.</p>
        <div className="grid grid-cols-2 gap-3">
          {PRINCIPLES.map(({ label, desc }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-4">
              <div className="font-heading font-bold text-text-primary text-sm mb-1.5">{label}</div>
              <p className="text-text-muted text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Content Style Guide ── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold text-text-primary mb-1 pl-4 border-l-2 border-accent-cyan">
          Content Style Guide
        </h2>
        <p className="text-text-muted text-xs mb-5 pl-4">Each content style has its own rules. Read the one you&apos;re editing before you start.</p>
        <div className="space-y-4">
          {CONTENT_TYPES.map(({ id, color, accent, bg, title, tagline, desc, rules }) => (
            <div key={id} className={cn("bg-surface border border-border rounded-xl overflow-hidden border-l-4", color)}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className={cn("text-xs font-bold uppercase tracking-widest mb-1", accent)}>{title}</div>
                    <div className="font-heading font-bold text-text-primary text-base">{tagline}</div>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full shrink-0", bg, accent)}>
                    {title.toUpperCase()}
                  </span>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">{desc}</p>
                <div className="space-y-2">
                  {rules.map((rule, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className={cn("w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5", bg, accent)}>
                        {i + 1}
                      </div>
                      <p className="text-text-secondary text-xs leading-relaxed">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Folder Guide ── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold text-text-primary mb-1 pl-4 border-l-2 border-accent-orange">
          Your Asset Folders — What&apos;s In Each One
        </h2>
        <p className="text-text-muted text-xs mb-2 pl-4">
          All footage is organized in the{" "}
          <Link href="/dashboard/assets" className="text-accent-cyan hover:underline inline-flex items-center gap-0.5">
            Assets page <ChevronRight className="w-3 h-3" />
          </Link>
          {" "}under Content Folders. Here&apos;s what to expect in each one.
        </p>
        <p className="text-text-muted text-xs mb-5 pl-4">Learn the folders so you know exactly where to look when you need a specific type of shot.</p>

        <div className="space-y-3">
          {FOLDERS.map(({ name, color, bg, border, what, lookFor }) => (
            <div key={name} className={cn("bg-surface border rounded-xl p-4", border)}>
              <div className="flex items-start gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", bg)}>
                  <FolderOpen className={cn("w-4 h-4", color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("font-heading font-bold text-sm mb-1", color)}>{name}</div>
                  <p className="text-text-secondary text-xs leading-relaxed mb-2">{what}</p>
                  <div className="bg-surface-raised rounded-lg px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">What to look for: </span>
                    <span className="text-xs text-text-secondary">{lookFor}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Visual Direction ── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold text-text-primary mb-1 pl-4 border-l-2 border-accent-cyan">
          Visual Direction
        </h2>
        <p className="text-text-muted text-xs mb-5 pl-4">The look and feel of every edit matters. This is the aesthetic target.</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Color Grade", value: "Moody, rich, cinematic. Slightly desaturated with warm highlights. No oversaturated filter looks — this isn't Instagram." },
            { label: "Lighting Target", value: "Golden hour and natural light are the goal. Avoid flat midday lighting. Embrace contrast and shadow." },
            { label: "Shot Composition", value: "Wide establishing shots for empire/lifestyle. Tight eye-level for talking head. Detail shots (hands, products, environments) for depth." },
            { label: "Pace & Rhythm", value: "Cut to the beat, but let cinematic shots breathe. Fast cuts during high energy, slow holds during emotional peaks." },
            { label: "Text Overlays", value: "Clean, minimal, bold. One font. Two weights max. His key phrases deserve their own frame — don't crowd them." },
            { label: "Raw Realness", value: "Not everything should feel produced. Unpolished talking shots and phone footage have their own power. Don't over-polish authenticity away." },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-4">
              <div className="text-xs font-bold text-accent-cyan uppercase tracking-wider mb-2">{label}</div>
              <p className="text-text-muted text-xs leading-relaxed">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Never Accept ── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold text-text-primary mb-1 pl-4 border-l-2 border-accent-orange">
          What We Never Accept
        </h2>
        <p className="text-text-muted text-xs mb-5 pl-4">Submit any of these and expect a revision request immediately.</p>
        <div className="flex flex-col gap-2">
          {NEVER_ACCEPT.map((item) => (
            <div key={item} className="flex items-start gap-3 bg-accent-orange/5 border border-accent-orange/20 rounded-xl px-4 py-3">
              <X className="w-4 h-4 text-accent-orange mt-0.5 shrink-0" />
              <p className="text-sm text-text-secondary">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing Brand Promise ── */}
      <section className="mb-6">
        <div className="bg-gradient-to-br from-surface to-surface-raised border border-border rounded-2xl p-6 text-center">
          <Anchor className="w-8 h-8 text-accent-cyan mx-auto mb-3" />
          <h3 className="font-heading text-xl font-bold text-text-primary mb-3">The Promise</h3>
          <p className="text-text-secondary text-sm leading-relaxed max-w-xl mx-auto mb-5">
            David Saylor&apos;s life proves that failure, addiction, and facing murder charges at 18 do not define you. He represents <span className="text-text-primary font-semibold">redemption through faith and discipline</span>. He represents <span className="text-text-primary font-semibold">family as the ultimate flex</span>. He represents <span className="text-text-primary font-semibold">an empire built on loyalty, legacy, and God</span>. Every edit you make is either reinforcing that story — or undercutting it. Make it count.
          </p>
          <div className="text-accent-cyan font-heading font-bold text-lg">
            &ldquo;Stay Anchored. Build for legacy. Don&apos;t fold under pressure.&rdquo;
          </div>
        </div>
      </section>

      {/* ── Sticky CTA ── */}
      <div className={cn(
        "fixed bottom-6 right-6 transition-all duration-300",
        showCTA ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <Link
          href="/dashboard/assets"
          className="flex items-center gap-2 bg-accent-cyan text-background px-5 py-3 rounded-xl font-semibold text-sm shadow-glow-cyan hover:bg-accent-cyan/90 transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          Go to Assets
        </Link>
      </div>
    </div>
  );
}
