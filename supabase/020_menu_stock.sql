-- ══════════════════════════════════════════════════════════════
--  كمية مخزون اختيارية لكل صنف. لو محطوطة، بتقل مع كل طلب،
--  ولما توصل صفر الصنف بيبقى "غير متاح" تلقائي. لو مش محطوطة،
--  الصنف يفضل متاح زي الأول (بدون تتبع كمية خالص).
-- ══════════════════════════════════════════════════════════════

alter table menu_items add column if not exists stock_qty integer;

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
