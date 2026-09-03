-- ══════════════════════════════════════════════════════════════
--  إصلاح نهائي — مش بس دلوقتي، لحماية من نفس المشكلة في المستقبل
-- ══════════════════════════════════════════════════════════════

-- ١) إصلاح فوري: أي نسخة موجودة دلوقتي من الدوال دي تاخد الصلاحية تاني
grant execute on function public.kitchen_login(text,text) to anon, public, authenticated;
grant execute on function public.kitchen_board(text,text) to anon, public, authenticated;
grant execute on function public.kitchen_set_status(text,text,text,text,text) to anon, public, authenticated;
grant execute on function public.kitchen_report(text,text,timestamptz,timestamptz) to anon, public, authenticated;

-- ٢) إصلاح دائم: أي دالة جديدة اتعمل بعد كده في schema "public" (حتى لو
--    بـ DROP ثم CREATE) هتاخد صلاحية anon تلقائي، من غير ما أحتاج أفتكر
--    أكتب grant منفصلة كل مرة — ده اللي كان بيسبب المشكلة كل مرة نضيف حاجة جديدة
alter default privileges in schema public grant execute on functions to anon;

notify pgrst, 'reload schema';
