# Edit-ify — Project Context for Claude

## What This Is
Edit-ify is a video editor freelance platform for a single client's content (David Saylor). Admin uploads assets and reviews editor submissions. Editors onboard, pick content styles, upload finished edits, and get paid per edit based on style. Two UX shells: Editor Dashboard (`/dashboard/*`) and Admin Panel (`/admin/*`).

## Stack
- **Next.js 14** (App Router, TypeScript)
- **Supabase** — auth, Postgres DB, Storage (`assets` + `submissions` buckets)
- **Google Drive API** — assets fetched from Drive folders via `lib/google-drive.ts`
- **Tailwind CSS v3** with custom design tokens (`tailwind.config.ts`)
- **Framer Motion** (`framer-motion`) — AnimatePresence, motion.div
- **@dnd-kit** — drag-to-rank in onboarding step 2
- **lucide-react** for icons

## Dev Server
```bash
PORT=3737 npm run dev
```
If stale cache (500/MODULE_NOT_FOUND errors): `npx kill-port 3737 && rm -rf .next && PORT=3737 npm run dev`

## Deployment
- **GitHub:** `https://github.com/massmediagenius/edit-ify2.0.git` (branch: `main`)
- **Vercel:** `https://edit-ify2-0.vercel.app` — live production
- **Vercel env vars required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_GOOGLE_API_KEY`
- Supabase email confirmation is **disabled** (Authentication → Providers → Email → Confirm email OFF)

## Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://olvdvrqanqgfseayeksw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSyBJHj113jpoL3-hMTmww8KxOa9xK3zacfs
```

## Supabase Setup Status
All SQL scripts have been run. Key tables:
- `profiles` — extends auth.users, has `role` (editor|admin), `onboarding_completed`, `pending_balance`, `approved_balance`, `total_earned`, `payout_method`, `payout_details`
- `content_styles` — edit categories with pricing (seeded with 5 styles)
- `submissions` — editor uploads, status: pending|approved|revision|re-uploaded|**rejected**
- `earnings` — one row per submission, auto-created by DB trigger, status: pending|approved|paid|**cancelled**
- `payout_requests` — editor payout requests, 14-day scheduled pay
- `assets` — admin-uploaded files metadata
- `drive_folders` — maps folder names → Google Drive folder IDs

**DB Triggers:**
- `on_auth_user_created` → auto-creates profile row on signup
- `on_submission_created` → auto-creates earnings row + adds to pending_balance
- `on_earning_status_change` → moves balances between pending/approved/paid; `cancelled` subtracts from pending_balance (floors at 0)

**RLS:** All tables have RLS enabled. Admins identified via `public.is_admin()` function.

**To make a user admin:** Supabase → Table Editor → profiles → set `role = 'admin'`

**SQL migrations to run in Supabase (if not already done):**
- `fix-payout-method-crypto.sql` — adds `'crypto'` to `payout_method` CHECK
- `fix-submission-status-rejected.sql` — adds `'rejected'` to `submissions.status` CHECK
- `fix-earnings-cancelled-on-reject.sql` — adds `'cancelled'` to `earnings.status` CHECK + extends trigger to reverse pending_balance on rejection

## Google Drive Integration
- Admin configures folder IDs in `/admin/assets` → "Configure Google Drive Folders" panel
- Folder IDs stored in `drive_folders` table
- Files fetched client-side via Google Drive API v3
- Thumbnails proxied server-side via `/api/drive-thumb` route (fixes CORS)
- Files with `thumbnailLink` from API use `?url=...` param; fallback uses `?id=...`
- Drive files (video/image): show thumbnail; Supabase uploads: use `<video>` element for first frame

## Asset Folders
Both editor and admin asset pages show **unified view** of Drive + Supabase uploads:
- Drive files show "Drive" badge (blue)
- Supabase uploads show "Uploaded" badge (orange)
- Folders: Talking Videos, B-roll, Podcast, Raw, Private jet, Las Vegas w/Steve
- Clicking a folder in admin also sets it as the upload destination

## Design Tokens (`tailwind.config.ts`)
```
background: #0F1115   surface: #1A1D24   surface-raised: #21252E   border: #2A2D35
accent-cyan: #00E5FF  accent-purple: #A855F7  accent-green: #22C55E
accent-orange: #F97316  accent-yellow: #EAB308
text-primary: #F1F5F9  text-secondary: #94A3B8  text-muted: #475569
```
Font families: `font-heading` (Jakarta), `font-body`/`font-sans` (Inter).

## Route Map

### Onboarding
Steps 1–4 save to Supabase via `upsert` (not localStorage). Step 4 sets `onboarding_completed = true`.
Middleware gates `/dashboard/**` — redirects to step-1 if not completed.
Payout methods on step 4: PayPal, Wise, Bank Transfer, Crypto (4 options in `grid-cols-2`).

### Editor Dashboard (`/dashboard/*`)
| Route | Notes |
|---|---|
| `/dashboard` | Content styles grid (top) + earnings incentive section (below). Balance stats in TopBar. HelpTips on stats and headings. |
| `/dashboard/upload` | Select content style → upload video → inserts into `submissions` → DB trigger creates `earnings` row. HelpTips on labels. |
| `/dashboard/assets` | Unified Drive + Supabase assets. Mobile: horizontal folder pills + 2-col grid. Desktop: folder sidebar + 3-4 col grid. Download shows spinner + fixed "Preparing your download…" toast while blob fetches. |
| `/dashboard/brand` | Static brand guidelines. David Saylor — ALTRD and MOTION brands. "Facing murder charges at 18" (NOT "convicted"). |
| `/dashboard/revisions` | All editor submissions with status tabs (All/Pending/Revision/Approved/Rejected). Rejected cards have red left border + highlighted rejection reason box. Click card → video preview modal with signed URL. |
| `/dashboard/earnings` | Real earnings from DB. Pending/approved/paid breakdown. Payout request ($50 min, 14-day wait). HelpTips on all stat cards. |
| `/dashboard/settings` | Profile + payout method: PayPal/Wise/Bank/Crypto. Crypto: coin dropdown (7 options) + wallet address + warning. |

**Editor layout features:**
- `GuidedTour` (9-step modal) auto-starts on first visit, re-triggers via `editify:start-tour` event. `localStorage` key: `editify_tour_v1`.
- `SubmissionNotifier` — live Supabase Realtime subscription; shows toast when admin approves/revisions/rejects a submission. Also catches up on missed notifications from last 7 days on load. Seen state in `localStorage` key `editify_notifs_seen_v1`. Auto-dismisses after 8s.
- `MobileNav` — fixed bottom tab bar (Home/Submit/Assets/Submissions/Earnings), `md:hidden`
- `Sidebar` — `hidden md:flex` desktop + mobile drawer via `editify:open-nav` event
- `TopBar` — hamburger on mobile fires `editify:open-nav`, hides balance stats on mobile
- Layout: `md:ml-[220px]`, `pb-20 md:pb-0`

### Admin Panel (`/admin/*`)
| Route | Notes |
|---|---|
| `/admin/queue` | Submissions table (desktop) + card list (mobile). Approve/revision/reject via ReviewModal. Status filter includes Rejected. |
| `/admin/library` | Grid of all submissions. Video thumbnails via signed URLs (loaded in parallel on mount). Download button on each card thumbnail. Click card → ReviewModal. Status filter includes Rejected. |
| `/admin/assets` | Drive folder config panel + unified Drive+Supabase grid. Upload to Supabase Storage, delete Supabase files. |
| `/admin/editors` | Real editor profiles from DB with submission counts and balances. |
| `/admin/categories` | CRUD for `content_styles` table. Inline price edit, active toggle. |
| `/admin/payouts` | Real `payout_requests`. Mark paid → decrements approved_balance. Export CSV. |

**Admin layout features:**
- `AdminMobileNav` — fixed bottom tab bar (Queue/Library/Assets/Editors/Payouts), `md:hidden`, orange accent
- `AdminSidebar` — `hidden md:flex` desktop + mobile drawer via `editify:open-admin-nav` event
- `AdminTopBar` — `left-0 md:left-[220px]`, hamburger on mobile, compact stats on mobile, full stats on desktop
- Layout: `md:ml-[220px]`, `pb-24 md:pb-6`

## Key Files
```
lib/supabase/client.ts                          → browser Supabase client
lib/supabase/server.ts                          → server Supabase client (uses cookies)
lib/google-drive.ts                             → Drive API helpers
middleware.ts                                   → auth + role routing + onboarding gate (null guard at top for missing env vars)
app/api/drive-thumb/route.ts                    → server-side thumbnail proxy
app/login/page.tsx                              → email/password login
app/signup/page.tsx                             → signup → creates profile → onboarding
supabase-schema.sql                             → full DB schema
fix-payout-method-crypto.sql                    → adds 'crypto' to payout_method CHECK constraint

app/dashboard/_components/GuidedTour.tsx        → 9-step animated tour modal, localStorage persistence
app/dashboard/_components/HelpTip.tsx           → tooltip ? button component, used across dashboard pages
app/dashboard/_components/MobileNav.tsx         → editor bottom tab bar
app/dashboard/_components/Sidebar.tsx           → editor sidebar + mobile drawer
app/dashboard/_components/TopBar.tsx            → editor top bar + hamburger
app/dashboard/_components/SubmissionNotifier.tsx → Supabase Realtime toasts for approved/revision/rejected events

app/(admin)/_components/AdminMobileNav.tsx      → admin bottom tab bar
app/(admin)/_components/AdminSidebar.tsx        → admin sidebar + mobile drawer
app/(admin)/_components/AdminTopBar.tsx         → admin top bar + hamburger
app/(admin)/_components/ReviewModal.tsx         → approve/revision/reject modal used in queue + library; reject requires a note
app/(admin)/_components/Toast.tsx               → toast notifications
```

## Payout Methods
`PayoutMethod = "paypal" | "wise" | "bank" | "crypto"`

Crypto coins supported: USDT-TRC20, USDT-ERC20, USDC-ERC20, USDC-SOL, BTC, ETH, SOL.
Wise currencies include PHP (Philippine Peso) for international editors.

## Signed URLs for Private Videos
`submissions` bucket is private. To get playable URL:
```ts
const parts = file_url.split("/submissions/");
const path = parts[1].split("?")[0];
const { data } = await supabase.storage.from("submissions").createSignedUrl(path, 3600);
```
Used in: ReviewModal, editor revisions page, admin library page (batch-loaded on mount).

## Cross-Component Events
| Event | Fired by | Handled by |
|---|---|---|
| `editify:start-tour` | Sidebar "Platform Tour" button | GuidedTour component |
| `editify:open-nav` | TopBar hamburger | Sidebar mobile drawer |
| `editify:open-admin-nav` | AdminTopBar hamburger | AdminSidebar mobile drawer |

## Rejection Flow
When admin rejects a submission:
1. `submissions.status` → `rejected`, `admin_notes` = rejection reason
2. `earnings.status` → `cancelled` (same row created by on_submission_created trigger)
3. DB trigger `on_earning_status_change` fires: `pending_balance = GREATEST(0, pending_balance - amount)`
4. Editor sees a red toast notification via `SubmissionNotifier` (realtime + catch-up on load)
5. Editor sees rejection reason in a red highlighted box on `/dashboard/revisions`

**Requires:** `fix-submission-status-rejected.sql` + `fix-earnings-cancelled-on-reject.sql` run in Supabase.

## Known Gotchas
- **Stale .next cache** causes MODULE_NOT_FOUND on server chunks — always `rm -rf .next` before restarting after major changes
- **Supabase upsert vs update** — all onboarding steps use `upsert` because the trigger that auto-creates profile rows may not have been run
- **Drive thumbnails** — only files where Drive API returns `thumbnailLink` get thumbnails; ID-only lookups return 404 for video files
- **`framer-motion`** — import from `"framer-motion"`, not `"motion"`
- **shadcn NOT via CLI** — all deps installed manually
- **DB constraint migrations** — run all three `fix-*.sql` files in Supabase SQL editor: crypto payout, rejected status, cancelled earnings
- **Vercel env vars** — must be added in Vercel project settings dashboard; `.env.local` is not deployed
- **Middleware null guard** — top of `middleware.ts` returns `NextResponse.next()` if Supabase env vars are missing, preventing MIDDLEWARE_INVOCATION_FAILED on Vercel cold starts before env vars are set
- **SubmissionNotifier seen state** — stored in `localStorage` key `editify_notifs_seen_v1`; clearing localStorage will re-show recent notifications once

## What's Left / Not Built Yet
- Brand page is static — no admin editor for it yet
- Revisions detail page (`/dashboard/revisions/[id]`) is still prototype UI
- No email notifications (only in-app toasts via SubmissionNotifier)
- Admin categories page not yet mobile-optimized (low priority)
