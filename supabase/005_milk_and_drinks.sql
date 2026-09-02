-- ══════════════════════════════════════════════════════════════
--  إضافة خيار "اللبن" + المشروبات الطبيعية (شاي / قهوة تركي / نسكافيه / ينسون)
--  آمن تشغّله على قاعدة بيانات شغّالة بالفعل، مش هيلمس أي حاجة موجودة.
-- ══════════════════════════════════════════════════════════════

alter table menu_items add column if not exists has_milk boolean default false;
alter table order_items add column if not exists milk boolean;

-- تحديث دالة شاشة البوفيه عشان ترجّع اختيار اللبن مع كل صنف
create or replace function public.kitchen_board(_token text)
returns table (
  order_no text, requester_first text, location text, status text,
  created_at timestamptz, items jsonb
) language plpgsql security definer set search_path = public as $$
declare _branch text;
begin
  select branch_id into _branch from display_tokens
   where token = _token and is_active;
  if _branch is null then
    raise exception 'invalid display token';
  end if;

  return query
    select o.order_no,
           split_part(o.requester_name, ' ', 1),
           o.location, o.status, o.created_at,
           coalesce(jsonb_agg(jsonb_build_object(
             'name_ar', i.name_ar, 'name_en', i.name_en,
             'qty', i.qty, 'sugar', i.sugar_level, 'milk', i.milk, 'note', i.note
           )) filter (where i.id is not null), '[]'::jsonb)
      from orders o
      left join order_items i on i.order_id = o.id
     where o.branch_id = _branch
       and o.status in ('new','preparing')
     group by o.id
     order by o.created_at;
end $$;

-- المشروبات الطبيعية — فرع ون قطامية بس دلوقتي
-- الأسعار مبدئية، عدّلها براحتك من لوحة الإدارة → قائمة البوفيه
insert into menu_items (name_ar,name_en,category,price,has_sugar,has_milk,colour,is_square,branch_id,sort) values
 ('شاي','Tea','drinks',12,true,true,'#B5651D',false,'kat',30),
 ('قهوة تركي','Turkish coffee','drinks',18,true,true,'#4A2E1C',false,'kat',29),
 ('نسكافيه','Instant coffee','drinks',20,true,true,'#8A6242',false,'kat',28),
 ('ينسون','Anise','drinks',12,true,false,'#D9C36B',false,'kat',27);
