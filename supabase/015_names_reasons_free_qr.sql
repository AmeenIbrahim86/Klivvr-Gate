-- ══════════════════════════════════════════════════════════════
--  ١) اسم الموظف بالعربي والإنجليزي منفصلين — شاشة البوفيه تختار
--     حسب لغتها هي نفسها، مش لغة اللي طلب وقت الإرسال
-- ══════════════════════════════════════════════════════════════
alter table profiles add column if not exists full_name_ar text;

alter table orders add column if not exists requester_name_ar text;
alter table orders add column if not exists requester_name_en text;
-- الطلبات القديمة: خلي الاسمين زي الاسم القديم لحد ما يتغيّروا
update orders set requester_name_ar = coalesce(requester_name_ar, requester_name),
                  requester_name_en = coalesce(requester_name_en, requester_name)
 where requester_name_ar is null or requester_name_en is null;

-- لو النسخة القديمة (بدون rejection_reason) موجودة، شيلها الأول عشان
-- Postgres مايرفضش تغيير شكل الجدول اللي بترجّعه الدالة
drop function if exists public.kitchen_board(text,text);
create or replace function public.kitchen_board(_branch text, _password text)
returns table (
  order_no text, requester_first_ar text, requester_first_en text, location text, status text,
  created_at timestamptz, items jsonb, rejection_reason text
) language plpgsql security definer set search_path = public as $$
begin
  if not kitchen_login(_branch, _password) then
    raise exception 'wrong password';
  end if;

  return query
    select o.order_no,
           split_part(coalesce(o.requester_name_ar,o.requester_name), ' ', 1),
           split_part(coalesce(o.requester_name_en,o.requester_name), ' ', 1),
           o.location, o.status, o.created_at,
           coalesce(jsonb_agg(jsonb_build_object(
             'name_ar', i.name_ar, 'name_en', i.name_en,
             'qty', i.qty, 'sugar', i.sugar_level, 'milk', i.milk, 'note', i.note
           )) filter (where i.id is not null), '[]'::jsonb),
           o.rejection_reason
      from orders o
      left join order_items i on i.order_id = o.id
     where o.branch_id = _branch
       and o.status in ('new','preparing')
     group by o.id
     order by o.created_at;
end $$;

-- ══════════════════════════════════════════════════════════════
--  ٢) سبب الرفض
-- ══════════════════════════════════════════════════════════════
alter table orders add column if not exists rejection_reason text;

create or replace function public.kitchen_set_status(
  _branch text, _password text, _order_no text, _status text, _reason text default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _status not in ('preparing','delivered','rejected') then
    raise exception 'bad status';
  end if;
  if not kitchen_login(_branch, _password) then
    raise exception 'wrong password';
  end if;

  update orders set
    status = _status,
    started_at   = case when _status = 'preparing' then now() else started_at end,
    delivered_at = case when _status = 'delivered' then now() else delivered_at end,
    rejection_reason = case when _status = 'rejected' then _reason else rejection_reason end
  where order_no = _order_no and branch_id = _branch and status in ('new','preparing');
end $$;

-- الدالة القديمة (بدون _reason) بقت زيادة عن الحاجة — نشيلها عشان ميحصلش تشويش بين النسختين
drop function if exists public.kitchen_set_status(text,text,text,text);

grant execute on function public.kitchen_board(text,text) to anon;
grant execute on function public.kitchen_set_status(text,text,text,text,text) to anon;

-- ══════════════════════════════════════════════════════════════
--  ٣) صنف "مجاني" بدل كتابة سعره صفر
-- ══════════════════════════════════════════════════════════════
alter table menu_items add column if not exists is_free boolean default false;

-- ══════════════════════════════════════════════════════════════
--  ٤) كود InstaPay لكل فرع، قابل للتغيير من الإدارة (مش ملف ثابت)
-- ══════════════════════════════════════════════════════════════
alter table branches add column if not exists payment_qr_url text;

notify pgrst, 'reload schema';
