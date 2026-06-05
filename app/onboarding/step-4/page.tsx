"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type PayoutMethod = "paypal" | "wise" | "bank";

const METHODS: { id: PayoutMethod; label: string }[] = [
  { id: "paypal", label: "PayPal" },
  { id: "wise", label: "Wise" },
  { id: "bank", label: "Bank Transfer" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "NGN", "GHS", "KES", "PHP"];

function Field({ label, type = "text", placeholder, value, onChange }: {
  label: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-text-secondary">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan transition-colors"
      />
    </div>
  );
}

export default function Step4() {
  const [method, setMethod] = useState<PayoutMethod>("paypal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // PayPal fields
  const [ppEmail, setPpEmail] = useState("");
  // Wise fields
  const [wiseEmail, setWiseEmail] = useState("");
  const [wiseCurrency, setWiseCurrency] = useState("USD");
  // Bank fields
  const [bankHolder, setBankHolder] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankRouting, setBankRouting] = useState("");
  const [bankName, setBankName] = useState("");

  function buildPayoutDetails() {
    if (method === "paypal") return { email: ppEmail };
    if (method === "wise") return { email: wiseEmail, currency: wiseCurrency };
    return { holder: bankHolder, account: bankAccount, routing: bankRouting, bank: bankName };
  }

  function isValid() {
    if (method === "paypal") return ppEmail.length > 0;
    if (method === "wise") return wiseEmail.length > 0;
    return bankHolder.length > 0 && bankAccount.length > 0 && bankRouting.length > 0 && bankName.length > 0;
  }

  async function handleComplete() {
    if (!isValid()) { setError("Please fill in all required fields."); return; }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired. Please log in again."); setLoading(false); return; }

    // upsert so it works even if the signup trigger didn't create the profile row
    const { error: dbError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? null,
      role: "editor",
      payout_method: method,
      payout_details: buildPayoutDetails(),
      onboarding_completed: true,
    }, { onConflict: "id" });

    if (dbError) { setError(dbError.message); setLoading(false); return; }
    router.push("/dashboard");
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">How you get paid</h1>
      <p className="text-text-secondary text-sm mb-6">Set up your payout preferences to start earning</p>

      {/* Pay tier info */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-surface-raised border border-accent-green/30 rounded-xl p-4">
          <div className="text-xs text-text-muted mb-1 font-medium">Entry Level</div>
          <div className="text-2xl font-heading font-bold text-accent-green">$5<span className="text-base font-normal text-text-muted">/edit</span></div>
          <p className="text-xs text-text-muted mt-1.5">Glow up, phone content, simple cuts</p>
        </div>
        <div className="bg-surface-raised border border-accent-cyan/30 rounded-xl p-4 relative">
          <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan">Top Pay</span>
          <div className="text-xs text-text-muted mb-1 font-medium">Premium Level</div>
          <div className="text-2xl font-heading font-bold text-accent-cyan">$15<span className="text-base font-normal text-text-muted">/edit</span></div>
          <p className="text-xs text-text-muted mt-1.5">Talking head, cinematic b-roll</p>
        </div>
      </div>

      {/* Payout callout */}
      <div className="border-l-2 border-accent-cyan bg-surface-raised rounded-r-xl px-4 py-3 mb-6">
        <p className="text-sm text-text-secondary">
          Payouts release every <span className="text-text-primary font-medium">2 weeks</span>. Minimum payout is <span className="text-text-primary font-medium">$50</span>.
        </p>
      </div>

      {/* Method selector */}
      <div className="flex gap-2 mb-2">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={cn(
              "flex-1 py-2 rounded-full text-sm font-medium border transition-all duration-200",
              method === m.id
                ? "bg-accent-cyan/15 border-accent-cyan text-accent-cyan"
                : "bg-surface-raised border-border text-text-secondary hover:border-text-muted"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Dynamic form */}
      <AnimatePresence mode="wait">
        {method === "paypal" && (
          <motion.div key="paypal" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pt-4">
              <Field label="PayPal Email" type="email" placeholder="you@example.com" value={ppEmail} onChange={setPpEmail} />
            </div>
          </motion.div>
        )}
        {method === "wise" && (
          <motion.div key="wise" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pt-4 flex flex-col gap-3">
              <Field label="Wise Email" type="email" placeholder="you@example.com" value={wiseEmail} onChange={setWiseEmail} />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">Preferred Currency</label>
                <select value={wiseCurrency} onChange={(e) => setWiseCurrency(e.target.value)} className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-cyan transition-colors">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </motion.div>
        )}
        {method === "bank" && (
          <motion.div key="bank" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Account Holder Name" placeholder="Full legal name" value={bankHolder} onChange={setBankHolder} />
              </div>
              <Field label="Account Number" placeholder="000000000" value={bankAccount} onChange={setBankAccount} />
              <Field label="Routing Number" placeholder="000000000" value={bankRouting} onChange={setBankRouting} />
              <div className="col-span-2">
                <Field label="Bank Name" placeholder="e.g. Chase, Wells Fargo" value={bankName} onChange={setBankName} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-3 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleComplete}
        disabled={loading}
        className="w-full mt-6 py-3 rounded-xl font-semibold text-sm bg-accent-cyan text-background hover:bg-accent-cyan/90 shadow-glow-cyan transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving…" : "Complete Setup →"}
      </button>
    </div>
  );
}
