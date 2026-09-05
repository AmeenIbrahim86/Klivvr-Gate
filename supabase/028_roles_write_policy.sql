-- ══════════════════════════════════════════════════════════════
--  جدول roles كان قراءة بس، مفيش كتابة خالص — يعني إضافة دور
--  جديد (زي "C-Level"/"Management") كان مستحيل من الواجهة
-- ══════════════════════════════════════════════════════════════

create policy write_roles on roles for all to authenticated
  using (has_perm('access')) with check (has_perm('access'));

grant select, insert, update, delete on roles to authenticated;

notify pgrst, 'reload schema';
