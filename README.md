# Klivvr Gate

Internal company portal + buffet ordering system for three branches. Bilingual (Arabic/English) with full RTL support.

| | |
|---|---|
| Frontend | Vite (vanilla JS) — no framework, by design |
| Backend | Supabase (Postgres + Auth + Realtime + RLS + Storage) |
| Hosting | Cloudflare Pages (auto-deploys on push to `main`) |
| Auth | Microsoft/Entra ID (work accounts only, no separate passwords) |

Live: `https://klivvr-gate.<your-subdomain>.workers.dev`

---

## Architecture in three paragraphs

**The portal is company-wide** — news, policies, quick links, events, an org chart / staff directory, and a photo gallery. None of it is branch-specific.

**Only the buffet is branch-scoped.** Employees pick their branch once per order, and each branch has its own menu, its own InstaPay QR code, and its own kitchen display.

**Permissions are role × section**, enforced in the database via Postgres Row-Level Security — not just hidden in the UI. Each role (admin, HR, kitchen team, employee) is granted specific sections (news, menu, access, gallery, etc.) through the `role_permissions` table. Hiding a button in the UI is a courtesy; the real enforcement is server-side and can't be bypassed from the browser.

**The kitchen display needs no Microsoft sign-in.** It's opened with a plain URL (`kitchen.html?branch=kat`) and unlocked with a branch password that admins can change anytime from the portal — no secret token to lose track of, no code deploy needed to rotate access. The screen only ever calls two narrow, password-checked database functions (`kitchen_board`, `kitchen_set_status`) and never touches any table directly.

---

## Features

- **Portal home**: editable "About" banner, company news with optional photos, policy library with clickable document links, upcoming events with "Add to Outlook" links, quick links (with icons and short descriptions), a photo gallery, and an org chart that doubles as a staff directory (photo, title, email, phone, office — all synced from Entra ID).
- **Buffet ordering**: category filters (including a dedicated "Free" tab), sugar/milk options, per-item icons or photos, optional per-item stock counts that auto-hide an item once it sells out, free-item support that skips payment entirely, and a location field that's either free-text ("Office 312") or a dropdown of named meeting rooms.
- **Payment**: InstaPay QR (uploaded per branch, no code changes needed) or cash, with the kitchen display flagging cash-due orders.
- **Kitchen display**: real-time ticket board, bilingual two-word names (screen's language decides, not the orderer's), rejection reasons the employee can see on their own "My Orders" page, and a built-in reports view with a date range and CSV export.
- **Admin**: full CRUD for news/links/policies/events/menu/branches/gallery, a role × section permission matrix, an Entra ID sync button for the org chart (with automatic Arabic-name transliteration for the kitchen display), and per-branch kitchen password management.

---

## Local development

```bash
git clone https://github.com/AmeenIbrahim86/Klivvr-Gate.git
cd Klivvr-Gate
npm install
cp .env.example .env       # fill in your Supabase project's URL and publishable key
npm run dev
```

There's no mock-data mode — the app always talks to a real Supabase project. Point `.env` at a throwaway/dev project if you don't want to touch production data while developing.

---

## Setting up from scratch

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) — the free tier is enough to start.
2. **SQL Editor → New query** → paste the entire contents of `supabase/schema.sql` → **Run**. This creates every table, function, trigger, and RLS policy in one pass.
3. **Project Settings → API** → copy the **Project URL** and **anon/publishable key** into `.env`.
4. **Authentication → Providers → Azure** → enable it and fill in the **Client ID**, **Secret**, and **Azure Tenant URL** (`https://login.microsoftonline.com/<tenant-id>`) from an Entra app registration.
   - In Entra: **App registrations → New registration** → Redirect URI (Web) = `https://<project-ref>.supabase.co/auth/v1/callback`.
   - This is a plain delegated app — no admin consent needed, any employee can sign in with it.
5. **Authentication → URL Configuration** → set **Site URL** and add a **Redirect URL** pointing at your deployed site.
6. Promote yourself to admin after your first sign-in:
   ```sql
   update profiles set role_id = 'admin', branch_id = 'kat'
   where full_name ilike '%your name%';
   ```
7. Set an initial kitchen screen password for each branch (or use the defaults baked into `schema.sql`, then change them from **Admin → Overview** once you're signed in):
   ```sql
   select set_screen_password('kat', 'something-only-your-team-knows');
   ```

### 2. Cloudflare Pages

1. **Workers & Pages → Create → Pages → Connect to Git** → select the repo.
2. Build command: `npm run build`. Build output directory: `dist`.
3. **Settings → Environment variables** → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Push to `main` — Cloudflare deploys automatically from here on.

### 3. Org chart / staff directory sync (optional)

This needs a **second**, separate Entra app registration — application-level Graph access, not a user sign-in flow:

1. **Entra → App registrations → New registration** (e.g. "Klivvr Gate - Org Sync").
2. **API permissions → Microsoft Graph → Application permissions** → add `User.Read.All` → **Grant admin consent** (needs a Global Admin).
3. **Certificates & secrets → New client secret** → copy it.
4. **Supabase Dashboard → Edge Functions → Deploy a new function → Via Editor**, name it `sync-org`, paste `supabase/functions/sync-org/index.ts`, deploy.
5. Add secrets on that function: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`. (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.)
6. From the portal, **Org chart → Sync from Entra ID** (visible to anyone with the `access` permission).

Edge Functions are **not** deployed by `git push` — redeploy manually through the dashboard editor whenever `sync-org/index.ts` changes.

### 4. Kitchen screens

Bookmark one URL per branch on each kiosk device:

```
https://<your-site>/kitchen.html?branch=kat
https://<your-site>/kitchen.html?branch=moh
```

The link itself isn't secret — the password is. Change it anytime from **Admin → Overview → Buffet screens**, no redeploy required.

---

## File structure

```
├─ index.html                 Portal shell (news, ordering, admin — one page, client-rendered)
├─ kitchen.html                Kitchen display shell (no sign-in)
├─ src/
│  ├─ main.js                  Everything the signed-in portal renders and does
│  ├─ kitchen.js                Everything the password-gated kitchen screen renders and does
│  └─ api.js                    The only file that talks to Supabase — swap backends by editing this one file
├─ supabase/
│  ├─ schema.sql                 Canonical schema — run this once for a brand-new project
│  ├─ 000_reset_if_needed.sql    Nuclear reset, only if you need to start over
│  ├─ 002…020_*.sql              Incremental migrations, for projects that already ran an older schema.sql
│  └─ functions/sync-org/        Edge Function: pulls org chart + photos from Microsoft Graph
├─ public/
│  ├─ instapay-qr-*.png          Fallback QR images (branches can override theirs from Admin)
│  ├─ klivvr-icon.png, klivvr-wordmark.svg   Brand assets
│  └─ prototype.html             Original standalone mock — reference only, not part of the app
└─ vite.config.js
```

**Rule of thumb:** anything that reads or writes data goes through `src/api.js`. If the backend ever changes, that's the one file to touch.

---

## Design decisions

**Why no framework?** The app is small enough that vanilla JS with template-string rendering stays readable. React would add build complexity without a clear payoff at this size — worth revisiting if the app grows past a dozen or so screens.

**Why Supabase over Firebase?** The permission model (role × section × branch) is genuinely relational, and Postgres RLS expresses it far more cleanly than a NoSQL security-rules DSL would.

**Why Cloudflare Pages?** Free, git-connected, and doesn't force a workflow-file detour the way GitHub Actions does for a static site.

**Why a password instead of a secret URL token for the kitchen screen?** A long random token in a URL is secure but operationally awkward — it can't be changed without editing a database row directly, and there's no way to hand a new one out without SQL access. A password that any admin can rotate from the UI is both simpler to operate and, in practice, at least as secure for a kiosk device sitting in a staff area.

**Why does the kitchen ticket show two words of the name instead of one?** First-name-only turned out to be genuinely ambiguous once there was more than one Mohamed or Ahmed on a shift. Two words is enough to disambiguate without printing a full legal name on a screen anyone walking past can read.
