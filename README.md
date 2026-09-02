# Company Portal

بوابة داخلية + نظام طلبات بوفيه لتلات فروع: **ون قطامية**، **أوبس هَب المهندسين**، **أوبس هَب مصدق** (قريباً).

| | |
|---|---|
| Frontend | Vite (vanilla JS) — بدون framework عن قصد |
| Backend | Supabase (Postgres + Auth + Realtime + RLS) |
| Hosting | GitHub Pages عن طريق GitHub Actions |
| اللغات | عربي / إنجليزي مع RTL كامل |

---

## المعمار في سطرين

**البوابة واحدة للشركة كلها** — أخبار وسياسات ولينكات وأحداث، مش مقسّمة فروع.
**البوفيه بس هو المقسّم فروع** — الموظف يحدد فرعه وقت الطلب، وكل فرع له شاشة مطبخ مستقلة.

الصلاحيات مبنية على **دور × قسم**: كل دور (أدمن، HR، فريق البوفيه، موظف) له صلاحية تعديل أقسام محددة. الجدول ده متطبّق في الـ database نفسها بـ RLS، مش في الـ frontend — يعني مفيش طريقة يتم تخطّيه من المتصفح.

**شاشة البوفيه مفيهاش تسجيل دخول.** بتشتغل بـ token في الـ URL، والـ token بيفتح دالتين بس (`kitchen_board` و `kitchen_set_status`) ومفيش وصول مباشر لأي جدول. الـ view بترجّع **الاسم الأول بس** — مفيش إيميلات ولا أرقام.

---

## التشغيل محلياً

```bash
git clone https://github.com/<user>/company-portal.git
cd company-portal
npm install
cp .env.example .env       # املأ القيم
npm run dev
```

**عايز تجرب بدون backend؟** حط `VITE_USE_MOCK=true` في `.env` — التطبيق هيشتغل بداتا وهمية.

---

## الإعداد من الصفر

### ١. Supabase
1. اعمل project جديد على [supabase.com](https://supabase.com) — الـ **free tier** كفاية للبداية
2. **SQL Editor → New query** → الصق كل `supabase/schema.sql` → **Run**
3. **Project Settings → API** → انسخ `Project URL` و `anon public key` في `.env`
4. **Authentication → Providers** → فعّل **Azure** وحط `Client ID` و `Secret` من Entra ID
   - في Entra: App registration → Redirect URI = `https://<project>.supabase.co/auth/v1/callback`
   - كده الموظفين يدخلوا بحساب الشركة، مفيش باسوردات جديدة
5. **مهم:** غيّر التوكنات في جدول `display_tokens` لقيم عشوائية طويلة:
   ```sql
   update display_tokens set token = encode(gen_random_bytes(24),'hex') where branch_id='kat';
   select branch_id, token from display_tokens;
   ```
6. اعمل نفسك أدمن (بعد أول تسجيل دخول):
   ```sql
   update profiles set role_id='admin', branch_id='kat' where full_name ilike '%أمين%';
   ```

### ٢. GitHub
```bash
git init
git add .
git commit -m "Initial commit: portal + buffet ordering"
git branch -M main
git remote add origin https://github.com/<user>/company-portal.git
git push -u origin main
```

**Settings → Secrets and variables → Actions:**

| النوع | الاسم | القيمة |
|---|---|---|
| Secret | `VITE_SUPABASE_URL` | رابط المشروع |
| Secret | `VITE_SUPABASE_ANON_KEY` | الـ anon key |
| Variable | `VITE_BASE` | `/company-portal/` |

**Settings → Pages → Source → GitHub Actions**

> الـ `anon key` آمن إنه يبان في المتصفح — هو مصمم لكده، والحماية الحقيقية في RLS. **لكن الـ `service_role` key عمرك ما تحطه في الـ frontend ولا في الـ repo.**

### ٣. شاشة البوفيه
على جهاز كل فرع، افتح Edge في وضع kiosk:

```bash
msedge.exe --kiosk "https://<user>.github.io/company-portal/kitchen.html?token=<التوكن>" --edge-kiosk-type=fullscreen
```

اظبط الجهاز على **متينامش** (Power settings → Never sleep).

---

## بنية الملفات

```
├─ index.html              البوابة + الطلب + الإدارة
├─ kitchen.html            شاشة البوفيه (بدون login)
├─ src/
│  ├─ api.js               ← الملف الوحيد اللي بيكلّم الـ backend
│  ├─ i18n.js              نصوص عربي/إنجليزي
│  ├─ ui/                  مكوّنات الواجهة
│  └─ styles.css           التوكنات والألوان
├─ supabase/schema.sql     الجداول + RLS + دوال الشاشة
├─ public/prototype.html   النموذج الأصلي (مرجع، شغّال لوحده)
└─ .github/workflows/      النشر التلقائي
```

**قاعدة:** أي حاجة بتلمس الداتا تمر من `src/api.js`. لو غيّرت الـ backend، تعدّل ملف واحد.

---

## خطة الشغل

- [x] نموذج شغّال بكل الشاشات
- [x] schema + RLS + شاشة بدون login
- [ ] **المرحلة ١** — ارفع الـ repo، شغّل الـ schema، انشر النموذج زي ما هو
- [ ] **المرحلة ٢** — بدّل طبقة التخزين المحلية بـ `src/api.js`
- [ ] **المرحلة ٣** — تسجيل دخول Microsoft + الصلاحيات الحقيقية
- [ ] **المرحلة ٤** — Realtime على شاشة البوفيه بدل polling
- [ ] **المرحلة ٥** — رفع ملفات السياسات على Supabase Storage
- [ ] **المرحلة ٦** — إشعارات (Teams webhook أو web push)
- [ ] لاحقاً — الدفع، وفرع مصدق

---

## قرارات وأسبابها

**ليه مفيش framework؟** النموذج بيشتغل بـ vanilla JS وحجمه صغير. React هيضيف build complexity من غير فايدة واضحة على الحجم ده. لو التطبيق كبر لـ ٢٠ شاشة، ساعتها نفكر.

**ليه Supabase مش Firebase؟** محتاجين SQL و row-level security حقيقي — الصلاحيات هنا معقدة (دور × قسم × فرع) وده أنضف بكتير في Postgres.

**ليه GitHub Pages؟** مجاني ومربوط بالـ repo. لو احتجت domain خاص أو edge functions، انقل لـ Cloudflare Pages — نفس الـ workflow تقريباً.

**ليه الاسم الأول بس في شاشة البوفيه؟** الشاشة معلّقة في مكان عام. مفيش سبب تعرض أسماء كاملة أو إيميلات على حيطة.
