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
    ('news','links','policies','events','menu','orders','access','gallery')),
  primary key (role_id, section)
);
insert into role_permissions values
  ('admin','news'),('admin','links'),('admin','policies'),('admin','events'),
  ('admin','menu'),('admin','orders'),('admin','access'),('admin','gallery'),
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
-- ملاحظة: published_on / effective_on نص حر مش تاريخ حقيقي (مثلاً "10 Aug") —
-- عشان ده نص للعرض بيتكتب من الأدمن مباشرة، والترتيب الفعلي بيحصل بعمود sort
-- أو created_at، مش ببارسينج تاريخ. أبسط وأضمن من التعامل مع أنواع Date.
create table news (
  id uuid primary key default gen_random_uuid(),
  tag_ar text, tag_en text,
  title_ar text not null, title_en text not null,
  body_ar text, body_en text,
  author text,
  published_on text default '',
  image_url text,
  is_published boolean default true,
  sort int default 0,
  created_at timestamptz default now()
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
  effective_on text default '', review_on date,
  sort int default 0
);

create table events (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null, title_en text not null,
  place_ar text, place_en text,
  day text not null, month_ar text not null, month_en text not null,
  image_url text,
  sort int default 0
);

-- ─── 6. البوفيه (ده الوحيد المقسّم فروع) ───
-- category نص حر (مش enum مقفول) عشان القوائم بتختلف من فرع لفرع وبتتغيّر بمرور الوقت
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null, name_en text not null,
  category text not null,
  price numeric(10,2) not null default 0,
  has_sugar boolean default false,
  has_milk boolean default false,
  is_available boolean default true,
  colour text default '#B5651D',
  is_square boolean default false,
  branch_id text references branches(id),   -- null = متاح في كل الفروع
  sort int default 0
);

-- ─── محتوى ابتدائي — عدّله من لوحة الإدارة براحتك بعد كده ───
insert into news (tag_ar,tag_en,title_ar,title_en,body_ar,body_en,author,published_on,sort) values
 ('إعلان','Announcement','البوابة الجديدة بقت شغالة','The new portal is live',
  'كل الأخبار والسياسات والخدمات في مكان واحد. ابدأ من اللينكات السريعة، ولو محتاج حاجة مش موجودة كلّم الـ IT.',
  'News, policies and services in one place. Start from the quick links, and tell IT if something you need is missing.',
  'Internal Comms','10 Aug',3),
 ('موارد بشرية','HR','سياسة العمل الهجين — محدّثة','Hybrid work policy — updated',
  'يومين من المكتب أسبوعياً، تبدأ من أول سبتمبر.','Two days in the office each week from 1 September.','HR','7 Aug',2),
 ('تشغيل','Ops','فرع مصدق بيفتح الشهر الجاي','The Mossadak branch opens next month',
  'الفرع التالت بيفتح أول أكتوبر، والبوفيه هيشتغل من أول يوم.',
  'The third branch opens 1 October, with the buffet running from day one.','Ops','2 Aug',1);

insert into quick_links (label_ar,label_en,icon,url,sort) values
 ('الإيميل','Email','✉','#',6),
 ('طلب إجازة','Request leave','◷','#',5),
 ('طلب دعم فني','IT support ticket','⚙','#',4),
 ('حجز قاعة اجتماعات','Book a meeting room','▣','#',3),
 ('دليل الموظفين','Staff directory','◫','#',2),
 ('الهيكل التنظيمي','Org chart','⊞','#',1);

insert into policies (title_ar,title_en,department,version,effective_on,sort) values
 ('سياسة الإجازات والأذونات','Leave and time-off policy','HR','3.2','10 Aug',5),
 ('سياسة أمن المعلومات','Information security policy','IT','2.0','28 Jul',4),
 ('لائحة السفر والمصاريف','Travel and expense rules','Finance','1.4','15 Jul',3),
 ('قواعد استخدام أجهزة الشركة','Company device usage rules','IT','1.0','3 Jul',2),
 ('مدونة السلوك المهني','Code of professional conduct','HR','2.3','20 Jun',1);

insert into events (title_ar,title_en,place_ar,place_en,day,month_ar,month_en,sort) values
 ('اجتماع كل الموظفين','All-hands meeting','قاعة النيل · ١١:٠٠ ص','Nile Room · 11:00 AM','14','أغسطس','AUG',3),
 ('ورشة الأمن السيبراني','Cybersecurity workshop','أونلاين · ٢:٠٠ م','Online · 2:00 PM','19','أغسطس','AUG',2),
 ('يوم التطوع السنوي','Annual volunteering day','خارج المقر · طول اليوم','Offsite · All day','25','أغسطس','AUG',1);

-- menu_items: 21 صنف — قائمة البوفيه الحقيقية، متاحة في كل الفروع (branch_id = null)
insert into menu_items (name_ar,name_en,category,price,colour,is_square,sort) values
 ('هوهوز','HOHOs','snacks',15,'#C4783A',true,21),
 ('توينكيز','Twinkies','snacks',15,'#E9C46A',true,20),
 ('مولتو','Molto','snacks',15,'#D98A3D',true,19),
 ('تودو براونيز','ToDo Brownies','snacks',20,'#6B4226',true,18),
 ('أوريو','OREO','biscuits',15,'#2B2118',true,17),
 ('أولكر','ÜLKER','biscuits',15,'#B5651D',true,16),
 ('ماكفيتيز','McVitie''s','biscuits',15,'#C9A66B',true,15),
 ('فيتنس أوت','Fitness Oat','biscuits',15,'#8FA05C',true,14),
 ('توك','TUC','biscuits',15,'#D9B24C',true,13),
 ('بروتين بار أبو عوف','Abu Auf Protein Bar','protein',70,'#7A4B2A',true,12),
 ('شيبسي بطاطس','Potato Chips','chips',15,'#E0A93E',true,11),
 ('بالانس بروتين كراكرز','Balance Protein Crackers','chips',20,'#C7B08A',true,10),
 ('بروتين بف أبو عوف','Abu Auf Protein Puffs','chips',25,'#D98C4A',true,9),
 ('مياه معدنية (صغيرة)','Mineral Water (Small)','drinks',10,'#A9C8F7',false,8),
 ('مياه غازية','Soft Drink','drinks',20,'#6FA8DC',false,7),
 ('ريد بُل','Red Bull','drinks',60,'#3A5FA0',false,6),
 ('مونستر','MONSTER','drinks',60,'#2E7D32',false,5),
 ('جبنة / مرتديلا / حلاوة','Cheese / Mortadella / Halawa','sandwiches',15,'#E8B04B',true,4),
 ('مكس','Mix','sandwiches',20,'#C97B3D',true,3),
 ('حلاوة و قشطة','Halawa & Qishta','sandwiches',25,'#D9A45C',true,2),
 ('تونة','Tuna','sandwiches',25,'#7C93A8',true,1);

-- ─── 7. الهيكل التنظيمي (متزامن من Entra ID) ───
-- الجدول ده بيتملى من Edge Function اسمها sync-org، مش من التطبيق مباشرة.
-- id هنا هو الـ object id بتاع الشخص في Entra ID، مش uuid عشوائي.
create table org_people (
  id text primary key,
  display_name text not null default '',
  job_title text default '',
  manager_id text references org_people(id) on delete set null,
  synced_at timestamptz default now()
);

create sequence order_seq start 1000;

-- ─── 8. معرض الصور ───
create table gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

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
  milk boolean,
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
alter table org_people      enable row level security;
alter table gallery         enable row level security;

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

-- الهيكل التنظيمي: أي موظف يقرأ. الكتابة بس عن طريق الـ Edge Function
-- (بيستخدم service_role اللي بيتخطى RLS بطبيعته، فمفيش policy للكتابة هنا خالص)
create policy read_org on org_people for select to authenticated using (true);

-- معرض الصور: أي موظف يقرأ، الكتابة بصلاحية gallery أو access
create policy read_gallery on gallery for select to authenticated using (true);
create policy write_gallery on gallery for all to authenticated
  using (has_perm('gallery') or has_perm('access'))
  with check (has_perm('gallery') or has_perm('access'));
grant select, insert, update, delete on gallery to authenticated;

-- مكان تخزين الملفات (الصور) — bucket عام للقراءة، مقيّد للرفع
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media public read" on storage.objects for select
  using (bucket_id = 'media');
create policy "media managed upload" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and (has_perm('gallery') or has_perm('access')));
create policy "media managed update" on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and (has_perm('gallery') or has_perm('access')));
create policy "media managed delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and (has_perm('gallery') or has_perm('access')));

-- ══════════════════════════════════════════════════════════════
--  شاشة البوفيه بدون تسجيل دخول — باسورد لكل فرع، اللينك نفسه عادي
--  (?branch=kat)، والأدمن يقدر يغيّر الباسورد من لوحة الإدارة في أي وقت
-- ══════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

alter table branches add column if not exists screen_password_hash text;
-- باسوردات ابتدائية — غيّرهم فورًا من الإدارة → نظرة عامة
update branches set screen_password_hash = extensions.crypt('710210', extensions.gen_salt('bf')) where id = 'kat';
update branches set screen_password_hash = extensions.crypt('304576', extensions.gen_salt('bf')) where id = 'moh';

create or replace function public.kitchen_login(_branch text, _password text)
returns boolean language plpgsql security definer set search_path = public as $$
declare _hash text;
begin
  select screen_password_hash into _hash from branches where id = _branch;
  if _hash is null then return false; end if;
  return extensions.crypt(_password, _hash) = _hash;
end $$;

-- دالة القراءة: الباسورد بس هو اللي يفتح، وبترجّع الحاجة اللي الشاشة محتاجاها بس
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
           split_part(o.requester_name, ' ', 1),   -- الاسم الأول بس، مفيش داتا شخصية زيادة
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

-- دالة تغيير الحالة من الشاشة
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

-- تغيير الباسورد — للأدمن بس (بيتأكد من صلاحية "access")
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
  update branches set screen_password_hash = extensions.crypt(_new_password, extensions.gen_salt('bf')) where id = _branch;
end $$;

-- الوصول للدالتين دول بس — مفيش وصول مباشر لأي جدول
revoke all on function public.kitchen_board(text,text) from public, anon, authenticated;
revoke all on function public.kitchen_set_status(text,text,text,text) from public, anon, authenticated;
revoke all on function public.kitchen_login(text,text) from public, anon, authenticated;
grant execute on function public.kitchen_board(text,text) to anon;
grant execute on function public.kitchen_set_status(text,text,text,text) to anon;
grant execute on function public.kitchen_login(text,text) to anon;

revoke all on function public.set_screen_password(text,text) from public, anon;
grant execute on function public.set_screen_password(text,text) to authenticated;


-- ─── Realtime للشاشة (أحسن من polling كل ٣٠ ثانية) ───
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;

-- ══════════════════════════════════════════════════════════════
--  GRANT — دي طبقة منفصلة عن RLS، وده تفصيلة سهل حد ينساها:
--  RLS بتحدد إيه الصفوف اللي تقدر تشوفها، لكن الـ role لازم يكون
--  عنده أصلاً حق يلمس الجدول (GRANT) قبل ما RLS تتفعّل خالص.
--  السطور دي احتياطية — لو الـ project عندك مظبوط صح بالفعل مش هتغيّر حاجة.
-- ══════════════════════════════════════════════════════════════
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
