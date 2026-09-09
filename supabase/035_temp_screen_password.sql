-- ══════════════════════════════════════════════════════════════
--  باسورد مؤقت لشاشة البوفيه — يشتغل جنب الباسورد الحقيقي من غير
--  ما يغيّره خالص، وينتهي لوحده بعد مدة محددة (افتراضي ساعة)
-- ══════════════════════════════════════════════════════════════

alter table branches add column if not exists temp_password_hash text;
alter table branches add column if not exists temp_password_expires_at timestamptz;

create or replace function public.kitchen_login(_branch text, _password text)
returns boolean language plpgsql security definer set search_path = public as $$
declare _hash text; _temp_hash text; _temp_exp timestamptz;
begin
  select screen_password_hash, temp_password_hash, temp_password_expires_at
    into _hash, _temp_hash, _temp_exp
    from branches where id = _branch;

  if _hash is not null and extensions.crypt(_password, _hash) = _hash then
    return true;
  end if;

  if _temp_hash is not null and _temp_exp is not null and _temp_exp > now()
     and extensions.crypt(_password, _temp_hash) = _temp_hash then
    return true;
  end if;

  return false;
end $$;

-- عمل باسورد مؤقت لفرع معيّن، صالح لعدد دقايق تحددها (افتراضي ٦٠ دقيقة)
create or replace function public.set_temp_screen_password(_branch text, _password text, _minutes int default 60)
returns void language plpgsql security definer set search_path = public as $$
begin
  update branches set
    temp_password_hash = extensions.crypt(_password, extensions.gen_salt('bf')),
    temp_password_expires_at = now() + (_minutes || ' minutes')::interval
  where id = _branch;
end $$;

notify pgrst, 'reload schema';

-- ══════════════════════════════════════════════════════════════
--  استخدم السطر ده دلوقتي عشان تعمل باسورد مؤقت لفرع كاتاميا،
--  صالح لساعة واحدة بس — غيّر 'temp-view-2026' لأي حاجة تحبها
-- ══════════════════════════════════════════════════════════════
select set_temp_screen_password('kat', 'temp-view-2026', 60);
