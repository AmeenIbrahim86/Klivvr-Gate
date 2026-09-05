-- ══════════════════════════════════════════════════════════════
--  صلاحية جديدة "portal" — تتحكم هل الدور يشوف الصفحة الرئيسية
--  (الأخبار/السياسات/اللينكات...) ولا لأ. مربوطة بالدور نفسه مش
--  بنوع الحساب (محلي/Microsoft)، فمرنة زي أي صلاحية تانية.
-- ══════════════════════════════════════════════════════════════

alter table role_permissions drop constraint if exists role_permissions_section_check;
alter table role_permissions add constraint role_permissions_section_check check (section in
  ('portal','news','links','policies','events','menu','orders','access','gallery',
   'rooms','suggestions','dashboard_buffet','dashboard_rooms'));

-- الأدمن والموارد البشرية والموظف العادي يفضلوا شايفين الصفحة الرئيسية
-- زي ما هي دلوقتي. فريق البوفيه (kitchen) مش بيتحطلهم — ده بالظبط
-- اللي كان مطلوب: تقدر تشيلها أو تديها لأي Role من "الصلاحيات" وقتما تحب.
insert into role_permissions (role_id, section) values
  ('admin','portal'), ('hr','portal'), ('viewer','portal')
on conflict (role_id, section) do nothing;

notify pgrst, 'reload schema';
