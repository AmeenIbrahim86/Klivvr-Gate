-- ══════════════════════════════════════════════════════════════
--  إصلاح: Supabase بيحط pgcrypto في schema اسمها "extensions"
--  مش "public" — فالدالتين كانوا بيدوروا في المكان الغلط.
-- ══════════════════════════════════════════════════════════════

create or replace function public.kitchen_login(_branch text, _password text)
returns boolean language plpgsql security definer set search_path = public as $$
declare _hash text;
begin
  select screen_password_hash into _hash from branches where id = _branch;
  if _hash is null then return false; end if;
  return extensions.crypt(_password, _hash) = _hash;
end $$;

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
  update branches set screen_password_hash = extensions.crypt(_new_password, extensions.gen_salt('bf'))
   where id = _branch;
end $$;

-- الباسوردات الابتدائية فشلت بصمت المرة اللي فاتت لنفس السبب — بنحطهم تاني دلوقتي
-- (الشرط "is null" بيحمي أي باسورد تكون غيّرته بنجاح فعلاً من فوق)
update branches set screen_password_hash = extensions.crypt('710210', extensions.gen_salt('bf'))
 where id = 'kat' and screen_password_hash is null;
update branches set screen_password_hash = extensions.crypt('304576', extensions.gen_salt('bf'))
 where id = 'moh' and screen_password_hash is null;

grant execute on function public.kitchen_login(text,text) to anon;
grant execute on function public.set_screen_password(text,text) to authenticated;

notify pgrst, 'reload schema';
