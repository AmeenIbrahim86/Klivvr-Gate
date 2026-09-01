-- ══════════════════════════════════════════════════════════════
--  Company Portal — schema
--  شغّل الملف ده في Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════

-- ─── 1. الفروع ───
create table branches (
  id        text primary key,
  name_ar   text not null,
  name_en   text not null,
  is_live   boolean not null default true,
  sort      int    not null default 0
);
insert into branches (id, name_ar, name_en, is_live, sort) values
  ('kat','ون قطامية','One Katameya',true,1),
  ('moh','أوبس هَب — المهندسين','Ops Hub — Mohandeseen',true,2),
  ('mos','أوبس هَب — مصدق','Ops Hub — Mossadak',false,3);

-- ─── 2. الأدوار والصلاحيات ───
create table roles (
  id      text primary key,
  name_ar text not null,
  name_en text not null
);
insert into roles values
  ('admin','أدمن','Admin'),
  ('hr','موارد بشرية','HR'),
  ('kitchen','فريق البوفيه','Buffet team'),
  ('viewer','موظف','Employee');

create table role_permissions (
  role_id text references roles(id) on delete cascade,
  section text not null check (section in
    ('news','links','policies','events','menu','orders','access')),
  primary key (role_id, section)
);
insert into role_permissions values
  ('admin','news'),('admin','links'),('admin','policies'),('admin','events'),
  ('admin','menu'),('admin','orders'),('admin','access'),
  ('hr','news'),('hr','policies'),('hr','events'),
  ('kitchen','orders'),('kitchen','menu');

-- ─── 3. بروفايل المستخدم (مربوط بـ auth.users) ───
create table profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role_id   text references roles(id) default 'viewer',
  branch_id text references branches(id),
  created_at timestamptz default now()
);

-- أول ما حد يسجّل، يتعمل له بروفايل تلقائي بدور "موظف"
create or replace function public.on_auth_user_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end $$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.on_auth_user_created();

-- ─── 4. دالة الصلاحيات (الأساس اللي كل RLS بيعتمد عليه) ───
create or replace function public.has_perm(_section text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from profiles p
    join role_permissions rp on rp.role_id = p.role_id
    where p.id = auth.uid() and rp.section = _section
  );
$$;

create or replace function public.my_branch()
returns text language sql stable security definer set search_path = public as $$
  select branch_id from profiles where id = auth.uid();
$$;

-- ─── 5. محتوى البوابة (واحد للشركة كلها — مش مقسّم فروع) ───
create table news (
  id uuid primary key default gen_random_uuid(),
  tag_ar text, tag_en text,
  title_ar text not null, title_en text not null,
  body_ar text, body_en text,
  author text,
  published_on date default current_date,
  is_published boolean default true,
  sort int default 0,
  updated_at timestamptz default now()
);

create table quick_links (
  id uuid primary key default gen_random_uuid(),
  label_ar text not null, label_en text not null,
  icon text, url text not null,
  sort int default 0
);

create table policies (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null, title_en text not null,
  department text, version text,
  file_url text,
  effective_on date, review_on date,
  sort int default 0
);

create table events (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null, title_en text not null,
  place_ar text, place_en text,
  starts_at timestamptz not null,
  sort int default 0
);

-- ─── 6. البوفيه (ده الوحيد المقسّم فروع) ───
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null, name_en text not null,
  category text not null check (category in ('hot','cold','snack')),
  price numeric(10,2) not null default 0,
  has_sugar boolean default false,
  is_available boolean default true,
  colour text default '#B5651D',
  is_square boolean default false,
  branch_id text references branches(id),   -- null = متاح في كل الفروع
  sort int default 0
);

create sequence order_seq start 1000;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null default 'ORD-' || nextval('order_seq'),
  branch_id text not null references branches(id),
  requester_id uuid references profiles(id) on delete set null,
  requester_name text not null,
  location text,
  status text not null default 'new' check (status in ('new','preparing','delivered','rejected')),
  total numeric(10,2) default 0,
  created_at timestamptz default now(),
  started_at timestamptz,
  delivered_at timestamptz
);
create index on orders (branch_id, status, created_at);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  name_ar text, name_en text,
  qty int not null default 1,
  sugar_level int check (sugar_level between 0 and 3),
  note text,
  line_total numeric(10,2) default 0
);
create index on order_items (order_id);

-- ══════════════════════════════════════════════════════════════
--  RLS — الأهم في الملف كله
-- ══════════════════════════════════════════════════════════════
alter table branches        enable row level security;
alter table roles           enable row level security;
alter table role_permissions enable row level security;
alter table profiles        enable row level security;
alter table news            enable row level security;
alter table quick_links     enable row level security;
alter table policies        enable row level security;
alter table events          enable row level security;
alter table menu_items      enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;

-- جداول المراجع: أي موظف مسجّل يقرأ
create policy read_branches on branches for select to authenticated using (true);
create policy read_roles    on roles    for select to authenticated using (true);
create policy read_perms    on role_permissions for select to authenticated using (true);

-- البروفايلات: أشوف بروفايلي، ومين عنده صلاحية access يشوف ويعدّل الكل
create policy read_own_profile on profiles for select to authenticated
  using (id = auth.uid() or has_perm('access'));
create policy manage_profiles on profiles for update to authenticated
  using (has_perm('access')) with check (has_perm('access'));

-- المحتوى: الكل يقرأ، وصاحب الصلاحية بس يكتب
create policy read_news on news for select to authenticated using (is_published or has_perm('news'));
create policy write_news on news for all to authenticated
  using (has_perm('news')) with check (has_perm('news'));

create policy read_links on quick_links for select to authenticated using (true);
create policy write_links on quick_links for all to authenticated
  using (has_perm('links')) with check (has_perm('links'));

create policy read_policies on policies for select to authenticated using (true);
create policy write_policies on policies for all to authenticated
  using (has_perm('policies')) with check (has_perm('policies'));

create policy read_events on events for select to authenticated using (true);
create policy write_events on events for all to authenticated
  using (has_perm('events')) with check (has_perm('events'));

create policy read_menu on menu_items for select to authenticated using (true);
create policy write_menu on menu_items for all to authenticated
  using (has_perm('menu')) with check (has_perm('menu'));

-- الطلبات: كل موظف يشوف طلباته هو، وفريق البوفيه يشوف طلبات فرعه
create policy read_own_orders on orders for select to authenticated
  using (requester_id = auth.uid() or (has_perm('orders') and branch_id = my_branch()) or has_perm('access'));
create policy create_own_orders on orders for insert to authenticated
  with check (requester_id = auth.uid());
create policy update_orders on orders for update to authenticated
  using (has_perm('orders')) with check (has_perm('orders'));

create policy read_own_items on order_items for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id
    and (o.requester_id = auth.uid() or has_perm('orders') or has_perm('access'))));
create policy create_own_items on order_items for insert to authenticated
  with check (exists (select 1 from orders o where o.id = order_id and o.requester_id = auth.uid()));

-- ══════════════════════════════════════════════════════════════
--  شاشة البوفيه بدون تسجيل دخول
--  الشاشة بتقرأ view مفلترة، والتوكن بيحدد الفرع
-- ══════════════════════════════════════════════════════════════
create table display_tokens (
  token     text primary key,
  branch_id text not null references branches(id),
  label     text,
  is_active boolean default true,
  created_at timestamptz default now()
);
-- ⚠️ غيّر التوكنات دي لقيم عشوائية طويلة قبل النشر
insert into display_tokens (token, branch_id, label) values
  ('CHANGE-ME-kat-a7f3c9', 'kat', 'شاشة قطامية'),
  ('CHANGE-ME-moh-b2e8d1', 'moh', 'شاشة المهندسين');

-- دالة القراءة: التوكن بس هو اللي يفتح، وبترجّع الحاجة اللي الشاشة محتاجاها بس
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
           split_part(o.requester_name, ' ', 1),   -- الاسم الأول بس، مفيش داتا شخصية زيادة
           o.location, o.status, o.created_at,
           coalesce(jsonb_agg(jsonb_build_object(
             'name_ar', i.name_ar, 'name_en', i.name_en,
             'qty', i.qty, 'sugar', i.sugar_level, 'note', i.note
           )) filter (where i.id is not null), '[]'::jsonb)
      from orders o
      left join order_items i on i.order_id = o.id
     where o.branch_id = _branch
       and o.status in ('new','preparing')
     group by o.id
     order by o.created_at;
end $$;

-- دالة تغيير الحالة من الشاشة
create or replace function public.kitchen_set_status(_token text, _order_no text, _status text)
returns void language plpgsql security definer set search_path = public as $$
declare _branch text;
begin
  if _status not in ('preparing','delivered','rejected') then
    raise exception 'bad status';
  end if;
  select branch_id into _branch from display_tokens where token = _token and is_active;
  if _branch is null then raise exception 'invalid display token'; end if;

  update orders set
    status = _status,
    started_at   = case when _status = 'preparing' then now() else started_at end,
    delivered_at = case when _status = 'delivered' then now() else delivered_at end
  where order_no = _order_no and branch_id = _branch and status in ('new','preparing');
end $$;

-- الوصول للدالتين دول بس — مفيش وصول مباشر لأي جدول
revoke all on function public.kitchen_board(text) from public, anon;
revoke all on function public.kitchen_set_status(text,text,text) from public, anon;
grant execute on function public.kitchen_board(text) to anon;
grant execute on function public.kitchen_set_status(text,text,text) to anon;

-- ─── Realtime للشاشة (أحسن من polling كل ٣٠ ثانية) ───
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
