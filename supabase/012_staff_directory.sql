-- ══════════════════════════════════════════════════════════════
--  الهيكل التنظيمي يبقى كمان دليل موظفين — إيميل، موبايل، الفرع
-- ══════════════════════════════════════════════════════════════
alter table org_people add column if not exists email text;
alter table org_people add column if not exists phone text;
alter table org_people add column if not exists office_location text;

-- ─── فروع قابلة للإضافة/الحذف من الإدارة ───
drop policy if exists write_branches on branches;
create policy write_branches on branches for all to authenticated
  using (has_perm('access')) with check (has_perm('access'));
grant select, insert, update, delete on branches to authenticated;
