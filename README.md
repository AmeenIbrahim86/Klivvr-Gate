# Company Portal

A generic, self-hostable internal company portal + branch-scoped buffet ordering system. Bilingual (Arabic/English) with full RTL support. Built for one company originally, but every piece of company identity — name, logo, colors — now lives in the database and is editable from an in-app **Branding** page, so the same codebase can be deployed for a different company without touching a single line of code.

| | |
|---|---|
| Frontend | Vite (vanilla JS) — no framework, by design |
| Backend | Supabase (Postgres + Auth + Realtime + RLS + Storage + Edge Functions) |
| Hosting | Any static host that builds with `npm run build` (Cloudflare Pages, Railway, Netlify, Vercel...) |
| Auth | Microsoft/Entra ID (work accounts), with an optional local email/password fallback for staff without a company email |

---

## Making it yours: the Branding page

**Admin → Branding** lets anyone with the `access` permission change, without redeploying anything:

- Company name (Arabic + English)
- Logo (uploaded, not baked into the repo)
- Primary color and accent color — every button, header, and gradient in the app derives from these two values at runtime

This is the intended way to re-skin the app for a new company. Nothing else in the source needs editing. The one thing that *does* need editing per-deployment is the list of branches and their names (**Admin → Overview**), since branch structure is inherently company-specific.

---

## Architecture in a few paragraphs

**The portal is company-wide** — news, policies, quick links, events, an org chart / staff directory, a photo gallery, meeting room booking, and an anonymous suggestion box. None of it is branch-specific.

**Only the buffet is branch-scoped.** Employees pick their branch once per order, and each branch has its own menu, its own payment QR code, and its own kitchen display.

**Permissions are role × section**, enforced in the database via Postgres Row-Level Security — not just hidden in the UI. Each role is granted specific sections (news, menu, access, gallery, dashboards, etc.) through the `role_permissions` table, and admins can create entirely new roles (e.g. "Management") from the UI. Hiding a button is a courtesy; the real enforcement is server-side and can't be bypassed from the browser.

**Meeting rooms are booked directly against real Microsoft 365 resource calendars** via Graph API — there's no local booking table to go stale or double-book. Reading availability and creating the booking both happen through an Edge Function using application-level Graph permissions, so the invite shows up in Outlook as the employee's own event with the room as a resource attendee.

**The kitchen display needs no Microsoft sign-in.** It's opened with a plain URL (`kitchen.html?branch=<id>`) and unlocked with a branch password that admins can change anytime from the portal — no secret token to lose track of, no deploy needed to rotate access. A temporary password can also be issued alongside the real one (auto-expiring) without disturbing what staff already use.

**Not everyone needs a Microsoft account.** Branch-level staff without a company email (e.g. a buffet team) can get a local email/password account created by an admin, scoped to whatever role and branch makes sense — including a role that skips the company home page entirely and lands straight on their dashboard.

---

## Features

- **Portal home**: editable "About" banner, company news with optional photos, policy library with clickable document links, upcoming events with "Add to Outlook" links, quick links (with icons, custom uploaded icons, and short descriptions), a photo gallery, and an org chart that doubles as a staff directory (photo, title, email, phone, office — synced from Entra ID, with automatic Arabic-name transliteration).
- **Buffet ordering**: category filters (including a dedicated "Free" tab), sugar/milk/mint options, fully custom per-item option lists (e.g. "Original / Diet / Coconut"), per-item icons or photos, optional stock counts that auto-hide an item once it sells out, and a location field that's either free-text or a dropdown of the employee's own branch's meeting rooms.
- **Payment**: QR code (uploaded per branch) or cash, with the kitchen display flagging cash-due orders.
- **Kitchen display**: real-time ticket board, bilingual two-word names (the screen's own language decides, not the orderer's), rejection reasons with a reason picker, a day-grouped "Closed Orders" review tab, and a reports view with a date range and CSV export.
- **Meeting room booking**: real Microsoft 365 calendar integration, a Sunday–Thursday / 9–6 policy, a daily per-employee cap, optional attendee invites pulled from the staff directory, and a personal "My Room Reservations" list with cancellation.
- **Dashboards & feedback**: separate buffet and meeting-room dashboards grantable to any role without full admin access, and an anonymous suggestion box that stores no link back to whoever submitted it.
- **Admin**: full CRUD for news/links/policies/events/menu/branches/rooms/gallery/roles, a role × section permission matrix, bulk branch/role assignment for people, an Entra ID sync button for the org chart, per-branch kitchen password management, local account creation/password-reset/deletion, and the Branding page described above.

---

## Local development

```bash
git clone <your-fork-url>
cd <repo-directory>
npm install
cp .env.example .env       # fill in your Supabase project's URL and publishable key
npm run dev
```

There's no mock-data mode — the app always talks to a real Supabase project. Point `.env` at a throwaway/dev project if you don't want to touch production data while developing.

---

## Setting up from scratch

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) — the free tier is enough to start.
2. **SQL Editor → New query** → paste the entire contents of `supabase/schema.sql` → **Run**. This creates every table, function, trigger, and RLS policy in one pass, seeded with generic placeholder branding.
3. **Project Settings → API** → copy the **Project URL** and **anon/publishable key** into `.env`.
4. **Authentication → Providers → Azure** → enable it and fill in the **Client ID**, **Secret**, and **Azure Tenant URL** (`https://login.microsoftonline.com/<tenant-id>`) from an Entra app registration.
   - In Entra: **App registrations → New registration** → Redirect URI (Web) = `https://<project-ref>.supabase.co/auth/v1/callback`.
   - This is a plain delegated app — no admin consent needed, any employee can sign in with it.
5. (Optional) **Authentication → Providers → Email** → enable it if you want to create local (non-Microsoft) accounts for branch staff.
6. **Authentication → URL Configuration** → set **Site URL** and add a **Redirect URL** pointing at your deployed site.
7. Promote yourself to admin after your first sign-in:
   ```sql
   update profiles set role_id = 'admin', branch_id = '<your-branch-id>'
   where full_name ilike '%your name%';
   ```
8. Set an initial kitchen screen password for each branch:
   ```sql
   select set_screen_password('<branch-id>', 'something-only-your-team-knows');
   ```
9. Log in, go to **Admin → Branding**, and set your company's real name, logo, and colors.

### 2. Hosting

Any static host that can run `npm run build` and serve the `dist/` folder works — Cloudflare Pages, Railway, Netlify, and Vercel have all been used with this codebase. Whichever you pick:

1. Connect the repo, set the build command to `npm run build` and the output directory to `dist`.
2. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Push to `main` — most of these platforms auto-deploy from there.

### 3. Org chart / staff directory sync (optional)

This needs a **second**, separate Entra app registration — application-level Graph access, not a user sign-in flow:

1. **Entra → App registrations → New registration** (e.g. "Portal - Org Sync").
2. **API permissions → Microsoft Graph → Application permissions** → add `User.Read.All` → **Grant admin consent** (needs a Global Admin).
3. **Certificates & secrets → New client secret** → copy it.
4. **Supabase Dashboard → Edge Functions → Deploy a new function → Via Editor**, name it `sync-org`, paste `supabase/functions/sync-org/index.ts`, deploy.
5. Add secrets on that function: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`. (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.)
6. From the portal, **Org chart → Sync from Entra ID** (visible to anyone with the `access` permission).

### 4. Meeting room booking (optional)

Add `Calendars.ReadWrite` **Application** permission to the same (or a new) Entra app registration used for org sync, grant admin consent, then deploy the `room-booking` Edge Function the same way as `sync-org`. From **Admin → Meeting Room Booking**, add each room and its real Microsoft resource mailbox address.

Edge Functions are **not** deployed by `git push` — redeploy manually through the dashboard editor whenever their code changes.

### 5. Kitchen screens

Bookmark one URL per branch on each kiosk device:

```
https://<your-site>/kitchen.html?branch=<branch-id>
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
│  ├─ 002…037_*.sql              Incremental migrations, for projects that already ran an older schema.sql
│  └─ functions/                 Edge Functions: sync-org, room-booking, create-local-user
├─ public/
│  ├─ instapay-qr-*.png          Fallback QR images (branches can override theirs from Admin)
│  ├─ klivvr-icon.png            Fallback logo — replace via Admin → Branding, no need to touch this file
│  └─ prototype.html             Original standalone mock — reference only, not part of the app
└─ vite.config.js
```

**Rule of thumb:** anything that reads or writes data goes through `src/api.js`. If the backend ever changes, that's the one file to touch.

---

## Design decisions

**Why no framework?** The app is small enough that vanilla JS with template-string rendering stays readable. React would add build complexity without a clear payoff at this size — worth revisiting if the app grows past a few dozen screens.

**Why Supabase over Firebase?** The permission model (role × section × branch) is genuinely relational, and Postgres RLS expresses it far more cleanly than a NoSQL security-rules DSL would.

**Why a password instead of a secret URL token for the kitchen screen?** A long random token in a URL is secure but operationally awkward — it can't be changed without editing a database row directly, and there's no way to hand a new one out without SQL access. A password that any admin can rotate from the UI is both simpler to operate and, in practice, at least as secure for a kiosk device sitting in a staff area.

**Why does the kitchen ticket show two words of the name instead of one?** First-name-only turned out to be genuinely ambiguous once there was more than one common first name on a shift. Two words is enough to disambiguate without printing a full legal name on a screen anyone walking past can read.

**Why real Microsoft calendars for room booking instead of a local table?** A local booking table would need its own conflict-detection logic and would inevitably drift from what Outlook actually shows. Booking directly against the resource mailbox means Exchange's own conflict handling is the only source of truth, and the invite behaves exactly like any other Outlook meeting.

**Why is branding data-driven instead of a config file?** A config file still requires a code change and redeploy to update. A database row can be edited by a non-technical admin from a form, instantly, which is the whole point of making this codebase reusable across companies.
