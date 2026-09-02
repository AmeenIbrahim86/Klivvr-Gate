-- ══════════════════════════════════════════════════════════════
--  شغّل الملف ده الأول بس لو كنت شغّلت نسخة قديمة من schema.sql قبل كده.
--  لو لسه معملتش حاجة على المشروع، تجاهله وروح على schema.sql على طول.
--
--  ⚠️ ده بيمسح كل الجداول والداتا اللي جوه schema "public" بالكامل.
--  المشروع لسه في مرحلة تجهيز ومفيش طلبات حقيقية عليه، فالمسح ده آمن دلوقتي —
--  لو بقى فيه استخدام حقيقي بعد كده، متشغّلش الملف ده تاني من غير نسخة احتياطية.
-- ══════════════════════════════════════════════════════════════

drop schema public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public grant all on tables to postgres, service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on functions to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated;

-- بعد كده: افتح schema.sql وشغّله كامل من الأول.
