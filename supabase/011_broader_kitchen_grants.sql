-- ══════════════════════════════════════════════════════════════
--  توسيع الصلاحية احتياطيًا + إجبار الكاش يتحدّث تاني
-- ══════════════════════════════════════════════════════════════

grant execute on function public.kitchen_login(text,text) to public;
grant execute on function public.kitchen_board(text,text) to public;
grant execute on function public.kitchen_set_status(text,text,text,text) to public;

grant execute on function public.kitchen_login(text,text) to anon, authenticated;
grant execute on function public.kitchen_board(text,text) to anon, authenticated;
grant execute on function public.kitchen_set_status(text,text,text,text) to anon, authenticated;

notify pgrst, 'reload schema';
notify pgrst, 'reload config';
