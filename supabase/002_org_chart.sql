-- ══════════════════════════════════════════════════════════════
--  إضافة الهيكل التنظيمي — شغّله لو schema.sql عندك أصلاً شغّال
--  (مش محتاج تعمل reset ولا تلمس أي حاجة موجودة، ده إضافة بس)
-- ══════════════════════════════════════════════════════════════

create table if not exists org_people (
  id text primary key,
  display_name text not null default '',
  job_title text default '',
  manager_id text references org_people(id) on delete set null,
  synced_at timestamptz default now()
);

alter table org_people enable row level security;

create policy read_org on org_people for select to authenticated using (true);

grant select, insert, update, delete on org_people to authenticated;
