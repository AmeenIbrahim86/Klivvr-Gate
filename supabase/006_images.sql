-- ══════════════════════════════════════════════════════════════
--  إضافة صور للأخبار والأحداث — آمن يتشغّل على قاعدة شغّالة بالفعل
-- ══════════════════════════════════════════════════════════════

alter table news add column if not exists image_url text;
alter table events add column if not exists image_url text;
