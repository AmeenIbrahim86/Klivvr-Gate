-- ══════════════════════════════════════════════════════════════
--  Knowledge Base و Who Owns What — نفس نمط الأخبار/السياسات
--  بالظبط، وصلاحيتين جداد "kb" و"owners" منفصلين
-- ══════════════════════════════════════════════════════════════

create table kb_articles (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null, title_en text not null,
  body_ar text, body_en text,
  category text,
  sort int not null default 0,
  created_at timestamptz default now()
);
alter table kb_articles enable row level security;
create policy read_kb on kb_articles for select to authenticated using (true);
create policy write_kb on kb_articles for all to authenticated
  using (has_perm('kb') or has_perm('access')) with check (has_perm('kb') or has_perm('access'));
grant select, insert, update, delete on kb_articles to authenticated;

create table service_owners (
  id uuid primary key default gen_random_uuid(),
  service_ar text not null, service_en text not null,
  owner_ar text, owner_en text,
  contact_email text, contact_link text,
  sort int not null default 0
);
alter table service_owners enable row level security;
create policy read_owners on service_owners for select to authenticated using (true);
create policy write_owners on service_owners for all to authenticated
  using (has_perm('owners') or has_perm('access')) with check (has_perm('owners') or has_perm('access'));
grant select, insert, update, delete on service_owners to authenticated;

alter table role_permissions drop constraint if exists role_permissions_section_check;
alter table role_permissions add constraint role_permissions_section_check check (section in
  ('portal','order_buffet','news','links','policies','events','menu','orders','access','gallery',
   'rooms','suggestions','dashboard_buffet','dashboard_rooms','kb','owners'));

insert into role_permissions (role_id, section) values
  ('admin','kb'), ('admin','owners')
on conflict (role_id, section) do nothing;

notify pgrst, 'reload schema';
