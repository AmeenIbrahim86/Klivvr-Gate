-- ══════════════════════════════════════════════════════════════
--  نظام Branding — اسم الشركة، اللوجو، وألوان البراند كلها بقت
--  قابلة للتعديل من لوحة الإدارة، مش متسجّلة في الكود خالص
-- ══════════════════════════════════════════════════════════════

alter table app_settings add column if not exists value_json jsonb;

insert into app_settings (key, value_json) values (
  'branding',
  jsonb_build_object(
    'siteNameAr', 'بوابة كليفر',
    'siteNameEn', 'Klivvr Gate',
    'logoUrl', '/klivvr-icon.png',
    'primaryColor', '#202042',
    'accentColor', '#F58A5C'
  )
) on conflict (key) do nothing;

-- خلي تعديل الـ Branding بصلاحية access بس (أكتر حساسية من نص "عن البوابة")
drop policy if exists write_settings on app_settings;
create policy write_settings on app_settings for all to authenticated
  using (case when key = 'branding' then has_perm('access') else (has_perm('news') or has_perm('access')) end)
  with check (case when key = 'branding' then has_perm('access') else (has_perm('news') or has_perm('access')) end);

-- شاشة تسجيل الدخول نفسها (قبل ما نعرف مين المستخدم) محتاجة تقرا الـ
-- branding عشان تعرض اسم/لوجو/ألوان الشركة قبل الدخول
drop policy if exists read_branding_anon on app_settings;
create policy read_branding_anon on app_settings for select to anon using (key = 'branding');
grant select on app_settings to anon;

notify pgrst, 'reload schema';
