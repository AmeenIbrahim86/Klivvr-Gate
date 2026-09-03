-- ══════════════════════════════════════════════════════════════
--  تقرير طلبات لمدة معيّنة — مين طلب، دفع كام، إزاي، وإمتى.
--  بيتفتح بنفس باسورد شاشة البوفيه، مش محتاج حساب Microsoft.
-- ══════════════════════════════════════════════════════════════

create or replace function public.kitchen_report(_branch text, _password text, _from timestamptz, _to timestamptz)
returns table (
  order_no text, requester_name text, total numeric, payment_method text, status text, created_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  if not kitchen_login(_branch, _password) then
    raise exception 'wrong password';
  end if;

  return query
    select o.order_no,
           coalesce(o.requester_name_en, o.requester_name_ar, o.requester_name),
           o.total, o.payment_method, o.status, o.created_at
      from orders o
     where o.branch_id = _branch
       and o.created_at >= _from and o.created_at < _to
     order by o.created_at desc;
end $$;

revoke all on function public.kitchen_report(text,text,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.kitchen_report(text,text,timestamptz,timestamptz) to anon;

notify pgrst, 'reload schema';
