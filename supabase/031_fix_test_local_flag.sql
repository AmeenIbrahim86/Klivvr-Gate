-- الحساب "test" اتعمل قبل ما الـ Edge Function المحدّثة (اللي بتحط is_local)
-- تتنشر، فخليه يتحط يدوي مرة واحدة بس. أي حساب محلي بعد كده هيتحط له
-- تلقائي مادام الـ Edge Function اتحدّثت.
update profiles set is_local = true where full_name = 'test';
