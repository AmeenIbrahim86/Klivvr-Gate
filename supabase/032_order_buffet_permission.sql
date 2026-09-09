-- ══════════════════════════════════════════════════════════════
--  صلاحية جديدة "order_buffet" — تتحكم هل الدور يقدر يطلب من
--  البوفيه ولا لأ. منفصلة عن "orders" اللي هي لإدارة الطلبات في
--  لوحة التحكم، دي بس بتتحكم في إمكانية الطلب نفسها كموظف.
-- ══════════════════════════════════════════════════════════════

alter table role_permissions drop constraint if exists role_permissions_section_check;
alter table role_permissions add constraint role_permissions_section_check check (section in
  ('portal','order_buffet','news','links','policies','events','menu','orders','access','gallery',
   'rooms','suggestions','dashboard_buffet','dashboard_rooms'));

-- نفس الأدوار اللي شايفة الصفحة الرئيسية دلوقتي (أدمن، موارد بشرية،
-- موظف) — تقدر تشيلها أو تديها لأي Role من "الصلاحيات" وقتما تحب
insert into role_permissions (role_id, section) values
  ('admin','order_buffet'), ('hr','order_buffet'), ('viewer','order_buffet')
on conflict (role_id, section) do nothing;

notify pgrst, 'reload schema';
