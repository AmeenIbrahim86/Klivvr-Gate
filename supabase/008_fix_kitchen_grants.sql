-- ══════════════════════════════════════════════════════════════
--  إصلاح صلاحيات دوال شاشة البوفيه + تنظيف النسخة القديمة
-- ══════════════════════════════════════════════════════════════

-- تأكيد الصلاحيات تاني — آمن تشغّله كذا مرة
grant execute on function public.kitchen_login(text,text) to anon;
grant execute on function public.kitchen_board(text,text) to anon;
grant execute on function public.kitchen_set_status(text,text,text,text) to anon;
grant execute on function public.set_screen_password(text,text) to authenticated;

-- شيل النسخة القديمة (بتاخد توكن واحد بس) اللي كانت بتسبب لبس
drop function if exists public.kitchen_board(text);
drop function if exists public.kitchen_set_status(text,text,text);

-- اجبر الـ API إنه يقرا الصلاحيات الجديدة فورًا بدل ما يستنى الكاش يتحدّث لوحده
notify pgrst, 'reload schema';
