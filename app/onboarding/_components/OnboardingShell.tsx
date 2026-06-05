"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { num: 1, label: "Software" },
  { num: 2, label: "Skill Rank" },
  { num: 3, label: "Content Type" },
  { num: 4, label: "Pay Setup" },
];

function getStep(pathname: string): number {
  const match = pathname.match(/step-(\d)/);
  return match ? parseInt(match[1]) : 1;
}

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = getStep(pathname);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8">
          <img src="/editify-logo.svg" alt="Edit-ify" className="h-8" />
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="p-6 pb-0 border-b border-border">
            <div className="flex items-center gap-0 mb-6">
              {steps.map((step, idx) => {
                const completed = step.num < currentStep;
                const active = step.num === currentStep;
                return (
                  <div key={step.num} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2",
                          completed && "bg-accent-cyan border-accent-cyan text-background",
                          active && "bg-transparent border-accent-cyan text-accent-cyan",
                          !completed && !active && "bg-transparent border-border text-text-muted"
                        )}
                      >
                        {completed ? <Check className="w-4 h-4" /> : step.num}
                      </div>
                      <span
                        className={cn(
                          "text-xs whitespace-nowrap",
                          active ? "text-accent-cyan" : completed ? "text-text-secondary" : "text-text-muted"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={cn(
                          "flex-1 h-0.5 mx-2 mt-[-12px] transition-all duration-300",
                          completed ? "bg-accent-cyan" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Animated content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
