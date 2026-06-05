"use client";

import { useEffect, useState } from "react";
import { Camera, Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Tab = "profile" | "payout" | "notifications";
type PayoutMethod = "paypal" | "wise" | "bank" | "crypto";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "payout", label: "Payout Method" },
  { id: "notifications", label: "Notifications" },
];

const PAYOUT_METHODS: { id: PayoutMethod; label: string; desc: string }[] = [
  { id: "paypal", label: "PayPal", desc: "Receive via PayPal email" },
  { id: "wise", label: "Wise", desc: "International transfers" },
  { id: "bank", label: "Bank Transfer", desc: "Direct bank deposit" },
  { id: "crypto", label: "Crypto", desc: "Bitcoin, ETH, USDT & more" },
];

const CRYPTO_COINS = [
  { value: "USDT-TRC20", label: "USDT — TRC-20 (Tron)" },
  { value: "USDT-ERC20", label: "USDT — ERC-20 (Ethereum)" },
  { value: "USDC-ERC20", label: "USDC — ERC-20 (Ethereum)" },
  { value: "USDC-SOL",   label: "USDC — Solana (SPL)" },
  { value: "BTC",        label: "Bitcoin (BTC)" },
  { value: "ETH",        label: "Ethereum (ETH)" },
  { value: "SOL",        label: "Solana (SOL)" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "NGN", "GHS", "KES", "PHP"];

const NOTIF_ITEMS = [
  { id: "edit_approved", label: "Edit Approved", desc: "When your edit gets approved" },
  { id: "revision_requested", label: "Revision Requested", desc: "When admin requests changes" },
  { id: "payout_released", label: "Payout Released", desc: "When your payout is processed" },
  { id: "new_assets", label: "New Assets Added", desc: "When new project assets are uploaded" },
  { id: "announcements", label: "Announcements", desc: "Platform news and updates" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Payout
  const [method, setMethod] = useState<PayoutMethod>("paypal");
  const [ppEmail, setPpEmail] = useState("");
  const [wiseEmail, setWiseEmail] = useState("");
  const [wiseCurrency, setWiseCurrency] = useState("USD");
  const [bankHolder, setBankHolder] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankRouting, setBankRouting] = useState("");
  const [bankName, setBankName] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoCoin, setCryptoCoin] = useState("USDT-TRC20");

  // Notifications
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_ITEMS.map((n) => [n.id, true]))
  );

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");

      const { data: profile } = await supabase.from("profiles").select("full_name, payout_method, payout_details").eq("id", user.id).single();
      if (!profile) return;

      setFullName(profile.full_name ?? "");

      if (profile.payout_method) setMethod(profile.payout_method as PayoutMethod);
      const d = profile.payout_details ?? {};
      setPpEmail(d.email ?? "");
      setWiseEmail(d.email ?? "");
      setWiseCurrency(d.currency ?? "USD");
      setBankHolder(d.holder ?? "");
      setBankAccount(d.account ?? "");
      setBankRouting(d.routing ?? "");
      setBankName(d.bank ?? "");
      setCryptoAddress(d.address ?? "");
      setCryptoCoin(d.coin ?? "USDT-TRC20");
    }
    load();
  }, []);

  async function saveProfile() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function savePayout() {
    setSaving(true);
    let details: Record<string, string> = {};
    if (method === "paypal") details = { email: ppEmail };
    else if (method === "wise") details = { email: wiseEmail, currency: wiseCurrency };
    else if (method === "crypto") details = { address: cryptoAddress, coin: cryptoCoin };
    else details = { holder: bankHolder, account: bankAccount, routing: bankRouting, bank: bankName };

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ payout_method: method, payout_details: details }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputCls = "w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/30";

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">Settings</h1>
      <p className="text-text-secondary text-sm mb-6">Manage your profile and payout preferences.</p>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSaved(false); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.id ? "border-accent-cyan text-accent-cyan" : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div className="space-y-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-accent-cyan/20 border-2 border-accent-cyan/40 flex items-center justify-center text-accent-cyan font-bold text-xl">
              {fullName ? fullName[0].toUpperCase() : "?"}
            </div>
            <button className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              <Camera className="w-4 h-4" />
              Change photo
            </button>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="Your name" />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Email</label>
            <div className="relative">
              <input value={email} readOnly className={cn(inputCls, "pr-10 opacity-60 cursor-not-allowed")} />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            </div>
            <p className="text-xs text-text-muted mt-1">Email cannot be changed here.</p>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-5 py-2.5 bg-accent-cyan text-background font-semibold rounded-xl text-sm hover:bg-accent-cyan/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      {/* Payout tab */}
      {tab === "payout" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 mb-2">
            {PAYOUT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all duration-200",
                  method === m.id ? "border-accent-cyan bg-accent-cyan/5" : "border-border bg-surface-raised hover:border-text-muted"
                )}
              >
                <div className={cn("text-sm font-semibold mb-0.5", method === m.id ? "text-accent-cyan" : "text-text-primary")}>{m.label}</div>
                <div className="text-xs text-text-muted">{m.desc}</div>
              </button>
            ))}
          </div>

          {method === "paypal" && (
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">PayPal Email</label>
              <input type="email" value={ppEmail} onChange={(e) => setPpEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
            </div>
          )}

          {method === "wise" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Wise Email</label>
                <input type="email" value={wiseEmail} onChange={(e) => setWiseEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Preferred Currency</label>
                <select value={wiseCurrency} onChange={(e) => setWiseCurrency(e.target.value)} className={inputCls}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {method === "bank" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm text-text-secondary mb-1.5">Account Holder Name</label>
                <input value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} className={inputCls} placeholder="Full legal name" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Account Number</label>
                <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className={inputCls} placeholder="000000000" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Routing Number</label>
                <input value={bankRouting} onChange={(e) => setBankRouting(e.target.value)} className={inputCls} placeholder="000000000" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-text-secondary mb-1.5">Bank Name</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputCls} placeholder="e.g. Chase" />
              </div>
            </div>
          )}

          {method === "crypto" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Coin & Network</label>
                <select value={cryptoCoin} onChange={(e) => setCryptoCoin(e.target.value)} className={inputCls}>
                  {CRYPTO_COINS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <p className="text-xs text-text-muted mt-1">
                  Make sure your wallet supports the network you select — sending to the wrong network results in lost funds.
                </p>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Wallet Address</label>
                <input
                  value={cryptoAddress}
                  onChange={(e) => setCryptoAddress(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. TRx7NHqjeKQxGTCi8q8ZY4pL13...  "
                  spellCheck={false}
                />
              </div>
              <div className="bg-accent-yellow/5 border border-accent-yellow/20 rounded-xl px-4 py-3 text-xs text-accent-yellow leading-relaxed">
                Double-check your wallet address before saving. Payouts sent to a wrong address cannot be recovered.
              </div>
            </div>
          )}

          <button
            onClick={savePayout}
            disabled={saving}
            className="px-5 py-2.5 bg-accent-cyan text-background font-semibold rounded-xl text-sm hover:bg-accent-cyan/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : saving ? "Saving…" : "Update Payout"}
          </button>
        </div>
      )}

      {/* Notifications tab */}
      {tab === "notifications" && (
        <div className="space-y-3">
          {NOTIF_ITEMS.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-surface-raised border border-border rounded-xl">
              <div>
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifs((p) => ({ ...p, [item.id]: !p[item.id] }))}
                className={cn(
                  "relative w-10 h-5.5 rounded-full transition-colors duration-200",
                  notifs[item.id] ? "bg-accent-cyan" : "bg-border"
                )}
                style={{ height: "22px" }}
              >
                <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200", notifs[item.id] ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
          ))}
          <p className="text-xs text-text-muted">Notification preferences are saved locally.</p>
        </div>
      )}
    </div>
  );
}
