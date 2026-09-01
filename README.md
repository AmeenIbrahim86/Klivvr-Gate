# Klivvr Gate — Company Portal

An internal portal plus a buffet ordering system for 3 branches: **One Katameya**, **Ops Hub Mohandeseen**, and **Ops Hub Mossadak** (coming soon).

| | |
|---|---|
| Frontend | Vite (vanilla JS) — no framework, on purpose |
| Backend | Supabase (Postgres + Auth + Realtime + RLS) |
| Hosting | GitHub Pages via GitHub Actions |
| Languages | Arabic / English with full RTL support |

---

## Architecture in two lines

**The portal is company-wide** — news, policies, quick links, and events are shared across all branches, not split per branch.
**Only the buffet is branch-scoped** — an employee picks their branch when ordering, and each branch has its own independent kitchen display.

Permissions are built on **role × section**: each role (Admin, HR, Buffet team, Employee) can edit specific sections. This mapping is enforced in the database itself via RLS, not in the frontend — so there's no way to bypass it from the browser.

**The kitchen display requires no sign-in.** It runs on a token in the URL, and that token only unlocks two functions (`kitchen_board` and `kitchen_set_status`) — there's no direct table access. The view returns **first name only** — no emails, no personal data.

---

## Running locally

```bash
git clone https://github.com/AmeenIbrahim86/Klivvr-Gate.git
cd Klivvr-Gate
npm install
cp .env.example .env       # fill in the values
npm run dev
```

**Want to try it without a backend?** Set `VITE_USE_MOCK=true` in `.env` — the app will run on sample data.

---

## Setup from scratch

### 1. Supabase
1. Create a new project at [supabase.com](https://supabase.com) — the **free tier** is enough to start
2. **SQL Editor → New query** → paste the entire `supabase/schema.sql` file → **Run**
3. **Project Settings → API** → copy the `Project URL` and `anon public key` into `.env`
4. **Authentication → Providers** → enable **Azure** and add your `Client ID` and `Secret` from Entra ID
   - In Entra: App registration → Redirect URI = `https://<project>.supabase.co/auth/v1/callback`
   - This lets employees sign in with their company account — no new passwords
5. **Important:** rotate the tokens in the `display_tokens` table to long random values:
   ```sql
   update display_tokens set token = encode(gen_random_bytes(24),'hex') where branch_id='kat';
   select branch_id, token from display_tokens;
   ```
6. Make yourself an admin (after your first sign-in):
   ```sql
   update profiles set role_id='admin', branch_id='kat' where full_name ilike '%Ameen%';
   ```

### 2. GitHub
```bash
git init
git add .
git commit -m "Initial commit: portal + buffet ordering"
git branch -M main
git remote add origin https://github.com/AmeenIbrahim86/Klivvr-Gate.git
git push -u origin main
```

**Settings → Secrets and variables → Actions:**

| Type | Name | Value |
|---|---|---|
| Secret | `VITE_SUPABASE_URL` | your project URL |
| Secret | `VITE_SUPABASE_ANON_KEY` | your anon key |
| Variable | `VITE_BASE` | `/Klivvr-Gate/` |

**Settings → Pages → Source → GitHub Actions**

> It's fine for the `anon key` to be visible in the browser — it's designed for that, and the real protection is RLS. **But the `service_role` key must never go in the frontend or the repo** — it bypasses RLS entirely.

### 3. Kitchen display
On each branch's device, open Edge in kiosk mode:

```bash
msedge.exe --kiosk "https://AmeenIbrahim86.github.io/Klivvr-Gate/kitchen.html?token=<the-token>" --edge-kiosk-type=fullscreen
```

Set the device to **never sleep** (Power settings → Never sleep).

---

## File structure

```
├─ index.html              Portal + ordering + admin
├─ kitchen.html             Kitchen display (no login)
├─ src/
│  ├─ api.js                ← the only file that talks to the backend
│  ├─ i18n.js                Arabic/English strings
│  ├─ ui/                    UI components
│  └─ styles.css             Design tokens and colours
├─ supabase/schema.sql      Tables + RLS + display functions
├─ public/prototype.html    The original prototype (reference, runs standalone)
└─ .github/workflows/       Automated deployment
```

**Rule:** anything that touches data goes through `src/api.js`. Swap the backend later, and you only edit one file.

---

## Roadmap

- [x] Working prototype with all screens
- [x] Schema + RLS + login-free display
- [ ] **Phase 1** — push the repo, run the schema, deploy the prototype as-is
- [ ] **Phase 2** — swap the local storage layer for `src/api.js`
- [ ] **Phase 3** — Microsoft sign-in + real permissions
- [ ] **Phase 4** — Realtime on the kitchen display instead of polling
- [ ] **Phase 5** — upload policy files to Supabase Storage
- [ ] **Phase 6** — notifications (Teams webhook or web push)
- [ ] Later — payments, and the Mossadak branch

---

## Decisions and why

**Why no framework?** The prototype runs on vanilla JS and its footprint is small. React would add build complexity without a clear benefit at this size. If the app grows to 20+ screens, we'll revisit.

**Why Supabase over Firebase?** We need SQL and real row-level security — permissions here are compound (role × section × branch), and that's far cleaner in Postgres.

**Why GitHub Pages?** Free and tied directly to the repo. If a custom domain or edge functions are needed later, moving to Cloudflare Pages keeps roughly the same workflow.

**Why first name only on the kitchen display?** The screen hangs in a public space. There's no reason to show full names or emails on a wall.
