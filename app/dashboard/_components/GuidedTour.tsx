"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, ChevronLeft, CheckCircle,
  LayoutDashboard, Upload, FolderOpen, BookOpen,
  DollarSign, MessageSquare, Layers, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOUR_KEY = "editify_tour_v1";

interface TourStep {
  icon: React.ReactNode;
  iconBg: string;
  badge: string;
  badgeColor: string;
  title: string;
  body: string;
  tips: string[];
}

const STEPS: TourStep[] = [
  {
    icon: <LayoutDashboard className="w-5 h-5 text-accent-cyan" />,
    iconBg: "bg-accent-cyan/15",
    badge: "Welcome",
    badgeColor: "bg-accent-cyan/10 text-accent-cyan",
    title: "Welcome to Edit-ify",
    body: "Edit-ify is your hub for submitting video edits and getting paid. This quick tour covers where to get footage, how to submit an edit, and how to maximize your income.",
    tips: [
      "You can replay this tour anytime via the ? button in the sidebar",
      "Two main areas: your editor dashboard and the assets library",
      "Everything is built to help you submit edits as fast as possible",
    ],
  },
  {
    icon: <Layers className="w-5 h-5 text-accent-purple" />,
    iconBg: "bg-accent-purple/15",
    badge: "Home",
    badgeColor: "bg-accent-purple/10 text-accent-purple",
    title: "Content Styles & Pay Rates",
    body: "The home page shows all available content styles — each with its own pay rate per edit. Click any card to see the brand guide, watch example videos, and start an edit for that style.",
    tips: [
      "Higher level styles (L2, L3+) pay more per edit",
      "Read the style guide — matching the brief gets approved faster",
      "Hover a card to preview the video style before picking",
      "No daily limit — submit as many edits as you can",
    ],
  },
  {
    icon: <Upload className="w-5 h-5 text-accent-cyan" />,
    iconBg: "bg-accent-cyan/15",
    badge: "Submit Edit",
    badgeColor: "bg-accent-cyan/10 text-accent-cyan",
    title: "How to Submit an Edit",
    body: "Click \"Submit Edit\" in the sidebar. Pick the content style your edit matches, drag and drop your finished video, and hit Submit. Your edit enters the review queue immediately.",
    tips: [
      "Use MP4 format — fastest upload and processing",
      "Match the content style to the edit you actually made",
      "No daily limit — submit as many edits as you want",
      "After submitting, go to My Submissions to track its status",
    ],
  },
  {
    icon: <FolderOpen className="w-5 h-5 text-accent-orange" />,
    iconBg: "bg-accent-orange/15",
    badge: "Assets",
    badgeColor: "bg-accent-orange/10 text-accent-orange",
    title: "Where to Get Content — Raw Footage",
    body: "Click \"Assets\" in the sidebar to access all footage. The Content Folders section has David's original material organized by type:",
    tips: [
      "Talking Videos — David on camera, perfect for motivational cuts",
      "B-roll — lifestyle footage, travel, daily life for cutaways",
      "Podcast — full recordings to turn into short viral clips",
      "Raw — unedited footage with full creative freedom",
      "Private Jet — luxury lifestyle shots",
      "Las Vegas w/Steve — event and social content",
      "Old Pics of David — throwback photos for Glow Up before/after edits",
    ],
  },
  {
    icon: <FolderOpen className="w-5 h-5 text-accent-purple" />,
    iconBg: "bg-accent-purple/15",
    badge: "Editing Tools",
    badgeColor: "bg-accent-purple/10 text-accent-purple",
    title: "Editing Resources — Everything You Need",
    body: "Scroll the Assets sidebar to \"Editing Assets\" — all the tools to finish a polished edit:",
    tips: [
      "FONTS — brand typefaces for text overlays and captions",
      "Stock Visuals — extra footage and motion graphics",
      "BG Music — background tracks cleared for use in all edits",
      "Black Screen Overlays — transitions, blurs, cinematic effects",
      "Download any file instantly with one click",
    ],
  },
  {
    icon: <BookOpen className="w-5 h-5 text-accent-yellow" />,
    iconBg: "bg-accent-yellow/15",
    badge: "Most Important",
    badgeColor: "bg-accent-yellow/10 text-accent-yellow",
    title: "The Brand Page — Read This First",
    body: "The Brand page contains David Saylor's full story, brand voice, and the exact content rules for each style. Read it before every edit session — it's the difference between getting approved and getting revision.",
    tips: [
      "David's arc: facing murder charges at 18 → faith, discipline, 8-figure empire",
      "Tone: raw, real, faith-led — not polished Instagram hype",
      "Every edit should reinforce his redemption and legacy narrative",
      "Brands shown: ALTRD and MOTION only",
    ],
  },
  {
    icon: <Palette className="w-5 h-5 text-accent-cyan" />,
    iconBg: "bg-accent-cyan/15",
    badge: "Brand Rules",
    badgeColor: "bg-accent-cyan/10 text-accent-cyan",
    title: "Matching Your Edit to the Brand",
    body: "Each content style has specific rules. Here's the quick guide so your edits hit the brief every time:",
    tips: [
      "Glow Up — before/after arc, use Old Pics + B-roll to show the contrast",
      "Talking Head — clean cuts, bold captions, motivational energy",
      "Podcast Clips — tight edits, cut dead air, always add captions",
      "B-Roll Lifestyle — cinematic, music-driven, no talking heads",
      "Anchored Thoughts — calm, faith-led tone with scripture or key quotes",
      "Key phrases: 'Stay Anchored.', 'Ten toes down.', 'Legacy over luxury.'",
    ],
  },
  {
    icon: <DollarSign className="w-5 h-5 text-accent-green" />,
    iconBg: "bg-accent-green/15",
    badge: "Earnings",
    badgeColor: "bg-accent-green/10 text-accent-green",
    title: "Earnings — Absolutely No Cap",
    body: "Every approved edit adds money to your balance. There is zero ceiling on how much you can make. Submit 10 edits = $100+. Submit 100 = $1,000+. Your income is 100% determined by how many edits you submit.",
    tips: [
      "Pending = edits still under review (not paid yet)",
      "Available = approved edits, ready to cash out now",
      "Minimum payout request is $50",
      "Payouts are sent within 14 days of your request",
      "Set up your payout method in Settings before requesting",
    ],
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-accent-cyan" />,
    iconBg: "bg-accent-cyan/15",
    badge: "My Submissions",
    badgeColor: "bg-accent-cyan/10 text-accent-cyan",
    title: "Tracking & Getting Paid",
    body: "\"My Submissions\" shows every edit you've uploaded with its review status. Preview your video, read admin feedback, and re-upload revised edits right from this page.",
    tips: [
      "Pending — under review, hang tight",
      "Revision — admin left feedback, fix and re-upload",
      "Approved — edit accepted, payment added to your balance",
      "Click any submission card to preview the video you uploaded",
      "The faster you fix revisions, the faster you get paid",
    ],
  },
];

export function GuidedTour({ autoStart = false }: { autoStart?: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (autoStart && typeof window !== "undefined") {
      if (!localStorage.getItem(TOUR_KEY)) setOpen(true);
    }
  }, [autoStart]);

  useEffect(() => {
    function handleStart() {
      setStep(0);
      setDir(1);
      setOpen(true);
    }
    window.addEventListener("editify:start-tour", handleStart);
    return () => window.removeEventListener("editify:start-tour", handleStart);
  }, []);

  function close() {
    if (typeof window !== "undefined") localStorage.setItem(TOUR_KEY, "1");
    setOpen(false);
  }

  function goNext() {
    setDir(1);
    setStep((s) => s + 1);
  }

  function goPrev() {
    setDir(-1);
    setStep((s) => s - 1);
  }

  function goTo(i: number) {
    setDir(i > step ? 1 : -1);
    setStep(i);
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            initial={{ scale: 0.93, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress bar */}
            <div className="h-1 bg-surface-raised">
              <motion.div
                className="h-full bg-accent-cyan rounded-full"
                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", current.iconBg)}>
                    {current.icon}
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase", current.badgeColor)}>
                    {current.badge}
                  </span>
                </div>
                <button
                  onClick={close}
                  className="w-7 h-7 rounded-lg hover:bg-surface-raised flex items-center justify-center text-text-muted hover:text-text-primary transition-colors shrink-0 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Animated step content */}
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={{
                    enter: (d: number) => ({ x: d * 28, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: number) => ({ x: d * -28, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <h2 className="font-heading text-xl font-bold text-text-primary mb-2">{current.title}</h2>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4">{current.body}</p>

                  <div className="bg-surface-raised border border-border rounded-xl p-4 space-y-2.5">
                    {current.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0 mt-[5px]" />
                        <span className="text-text-secondary text-sm leading-snug">{tip}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Footer */}
              <div className="flex items-center justify-between mt-6">
                {/* Dot nav */}
                <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={cn(
                        "rounded-full transition-all duration-200 shrink-0",
                        i === step ? "w-5 h-2 bg-accent-cyan" : "w-2 h-2 bg-border hover:bg-text-muted"
                      )}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {step > 0 && (
                    <button
                      onClick={goPrev}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  {isLast ? (
                    <button
                      onClick={close}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-accent-green text-background hover:bg-accent-green/90 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Let&apos;s go!
                    </button>
                  ) : (
                    <button
                      onClick={goNext}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-accent-cyan text-background hover:bg-accent-cyan/90 transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-center text-text-muted text-xs mt-3">
                {step + 1} / {STEPS.length}&nbsp;&nbsp;·&nbsp;&nbsp;
                <button
                  onClick={close}
                  className="hover:text-text-secondary transition-colors underline-offset-2 hover:underline"
                >
                  Skip tour
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
