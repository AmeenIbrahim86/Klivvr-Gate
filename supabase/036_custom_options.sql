-- ══════════════════════════════════════════════════════════════
--  اختيارات مخصصة لأي صنف — الأدمن بنفسه بيكتب الاختيارات (زي
--  Original/Diet/Coconut للريدبول)، والموظف يختار واحدة وقت الطلب
-- ══════════════════════════════════════════════════════════════

alter table menu_items add column if not exists custom_options jsonb;
alter table order_items add column if not exists custom_option_ar text;
alter table order_items add column if not exists custom_option_en text;

-- تحديث تذكرة البوفيه (المفتوحة والمقفولة) عشان تعرض الاختيار المطلوب
create or replace function public.kitchen_board(_branch text, _password text)
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
             'qty', i.qty, 'sugar', i.sugar_level, 'milk', i.milk, 'mint', i.mint,
             'option_ar', i.custom_option_ar, 'option_en', i.custom_option_en, 'note', i.note
           )) filter (where i.id is not null), '[]'::jsonb),
           o.rejection_reason, o.payment_method
      from orders o
      left join order_items i on i.order_id = o.id
     where o.branch_id = _branch
       and o.status in ('new','preparing')
     group by o.id
     order by o.created_at;
end $$;

create or replace function public.kitchen_closed_board(_branch text, _password text)
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
             'qty', i.qty, 'sugar', i.sugar_level, 'milk', i.milk, 'mint', i.mint,
             'option_ar', i.custom_option_ar, 'option_en', i.custom_option_en, 'note', i.note
           )) filter (where i.id is not null), '[]'::jsonb),
           o.rejection_reason, o.payment_method
      from orders o
      left join order_items i on i.order_id = o.id
     where o.branch_id = _branch
       and o.status in ('delivered','rejected')
     group by o.id
     order by o.created_at desc
     limit 50;
end $$;

notify pgrst, 'reload schema';
