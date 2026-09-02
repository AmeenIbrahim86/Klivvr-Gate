-- ══════════════════════════════════════════════════════════════
--  شاشة البوفيه: باسورد لكل فرع بدل التوكن السري في اللينك
--  اللينك بقى عادي (?branch=kat)، والحماية بقت باسورد الأدمن يقدر
--  يغيّره من لوحة الإدارة في أي وقت.
-- ══════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

alter table branches add column if not exists screen_password_hash text;

-- باسوردات ابتدائية للفروع الشغّالة — غيّرهم فورًا من الإدارة → نظرة عامة
update branches set screen_password_hash = crypt('710210', gen_salt('bf')) where id = 'kat';
update branches set screen_password_hash = crypt('304576', gen_salt('bf')) where id = 'moh';

-- تسجيل الدخول لشاشة فرع معيّن بالباسورد
create or replace function public.kitchen_login(_branch text, _password text)
returns boolean language plpgsql security definer set search_path = public as $$
declare _hash text;
begin
  select screen_password_hash into _hash from branches where id = _branch;
  if _hash is null then return false; end if;
  return crypt(_password, _hash) = _hash;
end $$;

-- عرض طلبات الفرع — بيتطلب الباسورد في كل نداء (مش توكن ثابت في اللينك)
create or replace function public.kitchen_board(_branch text, _password text)
returns table (
  order_no text, requester_first text, location text, status text,
  created_at timestamptz, items jsonb
) language plpgsql security definer set search_path = public as $$
begin
  if not kitchen_login(_branch, _password) then
    raise exception 'wrong password';
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

create or replace function public.kitchen_set_status(_branch text, _password text, _order_no text, _status text)
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
    delivered_at = case when _status = 'delivered' then now() else delivered_at end
  where order_no = _order_no and branch_id = _branch and status in ('new','preparing');
end $$;

-- تغيير الباسورد — للأدمن بس (بيتأكد من صلاحية "access" بتاعت المستخدم المسجّل دخول)
create or replace function public.set_screen_password(_branch text, _new_password text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from profiles p join role_permissions rp on rp.role_id = p.role_id
    where p.id = auth.uid() and rp.section = 'access'
  ) then
    raise exception 'forbidden';
  end if;
  if length(_new_password) < 4 then
    raise exception 'password too short';
  end if;
  update branches set screen_password_hash = crypt(_new_password, gen_salt('bf')) where id = _branch;
end $$;

-- الصلاحيات: الدوال القديمة كانت متاحة لـ anon (بدون تسجيل دخول) — نفس الحكاية هنا
revoke all on function public.kitchen_board(text,text) from public, anon, authenticated;
revoke all on function public.kitchen_set_status(text,text,text,text) from public, anon, authenticated;
revoke all on function public.kitchen_login(text,text) from public, anon, authenticated;
grant execute on function public.kitchen_board(text,text) to anon;
grant execute on function public.kitchen_set_status(text,text,text,text) to anon;
grant execute on function public.kitchen_login(text,text) to anon;

-- set_screen_password لازم تسجيل دخول (مش anon) عشان auth.uid() يشتغل صح
revoke all on function public.set_screen_password(text,text) from public, anon;
grant execute on function public.set_screen_password(text,text) to authenticated;

-- الدوال القديمة اللي بتاخد توكن مبقتش مستخدمة، ممكن تسيبها أو تشيلها — اختياري:
-- drop function if exists public.kitchen_board(text);
-- drop function if exists public.kitchen_set_status(text,text,text);
