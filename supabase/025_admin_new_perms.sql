-- ══════════════════════════════════════════════════════════════
--  صف "أدمن" في جدول الصلاحيات مقفول عمدًا في الواجهة (عشان محدش
--  يشيل صلاحياته بالغلط)، فأي قسم جديد بيتضاف بعد كده لازم يتحط
--  للأدمن مباشرة من هنا — مش هيقدر يفعّله بنفسه من الواجهة.
-- ══════════════════════════════════════════════════════════════

insert into role_permissions (role_id, section) values
  ('admin','rooms'), ('admin','suggestions'), ('admin','dashboard_buffet'), ('admin','dashboard_rooms')
on conflict (role_id, section) do nothing;

notify pgrst, 'reload schema';
