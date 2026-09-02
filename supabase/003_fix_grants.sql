-- ══════════════════════════════════════════════════════════════
--  إصلاح: الـ role "authenticated" ملوش صلاحية أصلاً على الجداول
--  (خطأ كان في 000_reset_if_needed.sql — بيدّي الصلاحية دلوقتي
--  لكل الجداول الموجودة، ولأي جدول هيتعمل بعد كده)
-- ══════════════════════════════════════════════════════════════

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- عشان أي جدول تعمله بعد كده ياخد نفس الصلاحية تلقائي، من غير ما تنسى تاني
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
