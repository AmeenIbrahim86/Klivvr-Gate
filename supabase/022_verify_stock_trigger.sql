-- ══════════════════════════════════════════════════════════════
--  تأكيد إن الخصم شغّال فعليًا جوّه الداتابيز (منفصل عن مشكلة الكاش
--  في المتصفح اللي اتصلحت في الكود). آمن تشغّله حتى لو التريجر
--  موجود بالفعل — بيستبدله بنسخة مطابقة.
-- ══════════════════════════════════════════════════════════════

create or replace function public.decrement_menu_stock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update menu_items
     set stock_qty    = greatest(stock_qty - new.qty, 0),
         is_available  = case when (stock_qty - new.qty) <= 0 then false else is_available end
   where id = new.menu_item_id
     and stock_qty is not null;
  return new;
end $$;

drop trigger if exists trg_decrement_menu_stock on order_items;
create trigger trg_decrement_menu_stock
  after insert on order_items
  for each row execute function public.decrement_menu_stock();

-- شغّل السطر ده لوحده بعد كده للتأكد إن التريجر موجود فعلاً (المفروض يرجّع صف واحد)
select tgname, tgenabled from pg_trigger where tgname = 'trg_decrement_menu_stock';
