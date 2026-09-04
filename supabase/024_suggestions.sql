-- ══════════════════════════════════════════════════════════════
--  صندوق اقتراحات مجهول تمامًا — مفيش أي عمود يربط الاقتراح
--  بصاحبه، حتى الأدمن نفسه ميقدرش يعرف مين كتبه. أي موظف يقدر
--  يبعت، وبس اللي معاه صلاحية "suggestions" يقدر يشوف/يمسح.
-- ══════════════════════════════════════════════════════════════

create table suggestions (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  created_at timestamptz default now()
);

alter table suggestions enable row level security;

-- أي موظف مسجّل دخول يقدر يبعت اقتراح (من غير ما نسجّل مين هو)
create policy insert_suggestions on suggestions for insert to authenticated with check (true);

-- بس اللي معاه صلاحية suggestions أو access يقدر يشوف أو يمسح
create policy read_suggestions on suggestions for select to authenticated using (has_perm('suggestions') or has_perm('access'));
create policy delete_suggestions on suggestions for delete to authenticated using (has_perm('suggestions') or has_perm('access'));

grant select, insert, delete on suggestions to authenticated;

-- الجدول عليه قيد يحدد أسماء الأقسام المسموحة — لازم نوسّعه للأقسام الجديدة
alter table role_permissions drop constraint if exists role_permissions_section_check;
alter table role_permissions add constraint role_permissions_section_check check (section in
  ('news','links','policies','events','menu','orders','access','gallery',
   'rooms','suggestions','dashboard_buffet','dashboard_rooms'));

-- دلوقتي فيه صلاحية "rooms" مخصوصة — وسّع صلاحية تعديل القاعات لتشملها (مش access بس)
drop policy if exists write_meeting_rooms on meeting_rooms;
create policy write_meeting_rooms on meeting_rooms for all to authenticated
  using (has_perm('rooms') or has_perm('access')) with check (has_perm('rooms') or has_perm('access'));

notify pgrst, 'reload schema';
