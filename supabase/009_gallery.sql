-- ══════════════════════════════════════════════════════════════
--  رفع صور حقيقي (مش لينكات) + قسم معرض الصور (Gallery)
-- ══════════════════════════════════════════════════════════════

-- ─── 1) مكان تخزين الملفات ───
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- أي حد يقرأ (الصور مش حاجة حساسة، وعشان تظهر في المتصفح بدون تعقيد)
drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select
  using (bucket_id = 'media');

-- الرفع/التعديل/الحذف بس لصاحب صلاحية gallery أو access
drop policy if exists "media managed upload" on storage.objects;
create policy "media managed upload" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and (has_perm('gallery') or has_perm('access')));

drop policy if exists "media managed update" on storage.objects;
create policy "media managed update" on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and (has_perm('gallery') or has_perm('access')));

drop policy if exists "media managed delete" on storage.objects;
create policy "media managed delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and (has_perm('gallery') or has_perm('access')));

-- ─── 2) جدول معرض الصور ───
create table if not exists gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);
alter table gallery enable row level security;

drop policy if exists read_gallery on gallery;
create policy read_gallery on gallery for select to authenticated using (true);

drop policy if exists write_gallery on gallery;
create policy write_gallery on gallery for all to authenticated
  using (has_perm('gallery') or has_perm('access'))
  with check (has_perm('gallery') or has_perm('access'));

grant select, insert, update, delete on gallery to authenticated;

-- ─── 3) صلاحية جديدة اسمها "gallery" — لازم نوسّع القيد المسموح بيه الأول ───
do $$
declare c text;
begin
  select conname into c from pg_constraint
   where conrelid = 'role_permissions'::regclass and contype = 'c';
  if c is not null then
    execute format('alter table role_permissions drop constraint %I', c);
  end if;
end $$;

alter table role_permissions add constraint role_permissions_section_check
  check (section in ('news','links','policies','events','menu','orders','access','gallery'));

insert into role_permissions (role_id, section)
values ('admin', 'gallery')
on conflict do nothing;
