-- ══════════════════════════════════════════════════════════════
--  ١) تذكرة البوفيه تعرض اسمين (الأول والتاني) مش اسم واحد بس —
--     عشان في أكتر من محمد ومحمود وأحمد في الشركة
--  ٢) وصف بسيط تحت عنوان أي quick link
-- ══════════════════════════════════════════════════════════════

alter table quick_links add column if not exists desc_ar text;
alter table quick_links add column if not exists desc_en text;

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
           array_to_string((string_to_array(trim(coalesce(o.requester_name_ar, o.requester_name)), ' '))[1:2], ' '),
           array_to_string((string_to_array(trim(coalesce(o.requester_name_en, o.requester_name)), ' '))[1:2], ' '),
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

notify pgrst, 'reload schema';
