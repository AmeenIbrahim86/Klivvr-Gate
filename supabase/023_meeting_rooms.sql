-- ══════════════════════════════════════════════════════════════
--  حجز قاعات الاجتماعات — مربوط مباشرة بتقويمات الـ Resource Mailboxes
--  الحقيقية في Microsoft 365. مفيش جدول حجوزات عندنا خالص — Microsoft
--  هو مصدر الحقيقة الوحيد، إحنا بس بنقرا ونكتب في تقويمه مباشرة.
-- ══════════════════════════════════════════════════════════════

create table meeting_rooms (
  id text primary key,
  name text not null,
  email text,                 -- عنوان الـ resource mailbox الحقيقي في Microsoft — الأدمن بيحطه
  sort int not null default 0
);

insert into meeting_rooms (id, name, sort) values
  ('dusk','Dusk',1),('dawn','Dawn',2),('skyline','Skyline',3),('golden-hour','Golden Hour',4),
  ('whisper-1','Whisper 1',5),('whisper-2','Whisper 2',6),('whisper-3','Whisper 3',7),
  ('whisper-4','Whisper 4',8),('whisper-5','Whisper 5',9),('whisper-6','Whisper 6',10),
  ('board-room','Board Room',11),('new-dawn','New Dawn',12),('euphoria','Euphoria',13),
  ('liberty','Liberty',14);

alter table meeting_rooms enable row level security;

create policy read_meeting_rooms on meeting_rooms for select to authenticated using (true);
create policy write_meeting_rooms on meeting_rooms for all to authenticated
  using (has_perm('access')) with check (has_perm('access'));

grant select, insert, update, delete on meeting_rooms to authenticated;

notify pgrst, 'reload schema';
