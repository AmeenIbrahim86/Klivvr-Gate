-- ══════════════════════════════════════════════════════════════
--  اختيار طريقة الدفع: كاش أو InstaPay — لو كاش، ما يظهرش QR،
--  وشاشة البوفيه تعرف إن الطلب ده هيتدفع كاش عشان الفريق يستنى الفلوس
-- ══════════════════════════════════════════════════════════════

alter table orders add column if not exists payment_method text default 'instapay';
alter table orders drop constraint if exists orders_payment_method_check;
alter table orders add constraint orders_payment_method_check
  check (payment_method in ('instapay','cash'));

-- لازم نشيل النسخة القديمة الأول عشان بنضيف عمود جديد في الرجوع (payment_method)
drop function if exists public.kitchen_board(text,text);
create function public.kitchen_board(_branch text, _password text)
returns table (
  order_no text, requester_first_ar text, requester_first_en text, location text, status text,
  created_at timestamptz, items jsonb, rejection_reason text, payment_method text
) language plpgsql security definer set search_path = public as $$
begin
  if not kitchen_login(_branch, _password) then
    raise exception 'wrong password';
  end if;

  return query
    select o.order_no,
           array_to_string((string_to_array(trim(coalesce(o.requester_name_ar, o.requester_name)), ' '))[1:2], ' '),
           array_to_string((string_to_array(trim(coalesce(o.requester_name_en, o.requester_name)), ' '))[1:2], ' '),
           o.location, o.status, o.created_at,
           coalesce(jsonb_agg(jsonb_build_object(
             'name_ar', i.name_ar, 'name_en', i.name_en,
             'qty', i.qty, 'sugar', i.sugar_level, 'milk', i.milk, 'note', i.note
           )) filter (where i.id is not null), '[]'::jsonb),
           o.rejection_reason, o.payment_method
      from orders o
      left join order_items i on i.order_id = o.id
     where o.branch_id = _branch
       and o.status in ('new','preparing')
     group by o.id
     order by o.created_at;
end $$;

revoke all on function public.kitchen_board(text,text) from public, anon, authenticated;
grant execute on function public.kitchen_board(text,text) to anon;

notify pgrst, 'reload schema';
