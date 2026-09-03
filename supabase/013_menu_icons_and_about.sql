-- ══════════════════════════════════════════════════════════════
--  أيقونة لكل صنف بوفيه (زي الأيقونات بتاعة Quick Links) +
--  كارت "عن البوابة" بسيط قابل للتعديل من الإدارة
-- ══════════════════════════════════════════════════════════════

alter table menu_items add column if not exists icon text;

-- جدول صغير لأي إعداد مفرد للتطبيق (مش قائمة، سطر واحد لكل مفتاح)
create table if not exists app_settings (
  key text primary key,
  value_ar text,
  value_en text,
  updated_at timestamptz default now()
);

insert into app_settings (key, value_ar, value_en) values (
  'about',
  'بوابة كليفر هي المكان الواحد لكل حاجة محتاجها في الشركة — الأخبار، السياسات، طلب البوفيه، ودليل الموظفين.',
  'Klivvr Gate is the one place for everything at the company — news, policies, ordering from the buffet, and the staff directory.'
) on conflict (key) do nothing;

alter table app_settings enable row level security;

drop policy if exists read_settings on app_settings;
create policy read_settings on app_settings for select to authenticated using (true);

drop policy if exists write_settings on app_settings;
create policy write_settings on app_settings for all to authenticated
  using (has_perm('news') or has_perm('access'))
  with check (has_perm('news') or has_perm('access'));

grant select, insert, update, delete on app_settings to authenticated;
