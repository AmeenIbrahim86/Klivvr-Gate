-- ══════════════════════════════════════════════════════════════
--  جدول role_permissions كان عنده SELECT بس، ومفيش INSERT/DELETE
--  خالص — يعني تفعيل أي صلاحية جديدة من واجهة "الصلاحيات" كان
--  مستحيل ينجح (RLS بيرفض أي كتابة من غير سياسة صريحة تسمح بيها)
-- ══════════════════════════════════════════════════════════════

drop policy if exists write_perms on role_permissions;
create policy write_perms on role_permissions for all to authenticated
  using (has_perm('access')) with check (has_perm('access'));

grant select, insert, update, delete on role_permissions to authenticated;

notify pgrst, 'reload schema';
