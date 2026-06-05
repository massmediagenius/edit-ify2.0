# Edit-ify — Project Context for Claude

## What This Is
Edit-ify is a video editor freelance platform for a single client's content. Admin uploads assets and reviews editor submissions. Editors onboard, pick content styles, upload finished edits, and get paid per edit based on style. Two UX shells: Editor Dashboard (`/dashboard/*`) and Admin Panel (`/admin/*`).

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
- `submissions` — editor uploads, status: pending|approved|revision|re-uploaded
- `earnings` — one row per submission, auto-created by DB trigger, status: pending|approved|paid
- `payout_requests` — editor payout requests, 14-day scheduled pay
- `assets` — admin-uploaded files metadata
- `drive_folders` — maps folder names → Google Drive folder IDs

**DB Triggers:**
- `on_auth_user_created` → auto-creates profile row on signup
- `on_submission_created` → auto-creates earnings row + adds to pending_balance
- `on_earning_status_change` → moves balances between pending/approved/paid

**RLS:** All tables have RLS enabled. Admins identified via `public.is_admin()` function.

**To make a user admin:** Supabase → Table Editor → profiles → set `role = 'admin'`

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

### Editor Dashboard (`/dashboard/*`)
| Route | Notes |
|---|---|
| `/dashboard` | Content style cards fetched from `content_styles` table. Click card → modal with examples + brand guide. Balance stats from `profiles`. |
| `/dashboard/upload` | Select content style → upload video → inserts into `submissions` → DB trigger creates `earnings` row |
| `/dashboard/assets` | Unified Drive + Supabase assets. Folder sidebar, search, preview modal, download. |
| `/dashboard/brand` | Static brand guidelines page |
| `/dashboard/revisions` | Revision list |
| `/dashboard/earnings` | Real earnings from DB. Pending/approved/paid breakdown. Payout request ($50 min, 14-day wait). |
| `/dashboard/settings` | Profile + payout method (PayPal/Wise/Bank) wired to Supabase. |

Sidebar adds Upload nav item. TopBar shows real balances. Both have working logout.

### Admin Panel (`/admin/*`)
| Route | Notes |
|---|---|
| `/admin/queue` | Fetches real submissions. Approve → updates submission + earnings status → triggers balance update. Revision → saves notes to DB. |
| `/admin/library` | All submissions with filters. Dynamic dropdowns from DB. |
| `/admin/assets` | Drive folder config panel + unified Drive+Supabase grid. Upload to Supabase Storage, delete Supabase files. Preview modal for both sources. Video thumbnails via `<video>` element. |
| `/admin/editors` | Real editor profiles from DB with submission counts and balances. |
| `/admin/categories` | CRUD for `content_styles` table. Inline price edit, active toggle. |
| `/admin/payouts` | Real `payout_requests`. Mark paid → decrements approved_balance. Export CSV. |

## Key Files
```
lib/supabase/client.ts        → browser Supabase client
lib/supabase/server.ts        → server Supabase client (uses cookies)
lib/google-drive.ts           → Drive API helpers (fetchDriveFolder, getDrivePreviewUrl, etc.)
middleware.ts                 → auth + role routing + onboarding gate
app/api/drive-thumb/route.ts  → server-side thumbnail proxy (fixes CORS for Drive thumbnails)
app/login/page.tsx            → email/password login
app/signup/page.tsx           → signup → creates profile → goes to onboarding
supabase-schema.sql           → full DB schema (run once in Supabase SQL editor)
fix-*.sql                     → incremental SQL fixes (already applied)
```

## Known Gotchas
- **Stale .next cache** causes MODULE_NOT_FOUND on server chunks — always `rm -rf .next` before restarting after major changes
- **Supabase upsert vs update** — all onboarding steps use `upsert` because the trigger that auto-creates profile rows may not have been run
- **Drive thumbnails** — only files where Drive API returns `thumbnailLink` get thumbnails; ID-only lookups return 404 for video files
- **`framer-motion`** — import from `"framer-motion"`, not `"motion"`
- **shadcn NOT via CLI** — all deps installed manually
- **Wise currency list** — includes PHP (Philippine Peso) for international editors

## What's Left / Not Built Yet
- Brand page is static — no admin editor for it yet
- Revisions detail page (`/dashboard/revisions/[id]`) is still prototype UI
- No email notifications when edits are approved or revisions requested
- No real-time updates (would use Supabase `subscribe`)
- Deployment to Vercel not done yet (push to GitHub → import to Vercel → add env vars)
