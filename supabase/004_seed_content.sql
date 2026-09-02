-- ══════════════════════════════════════════════════════════════
--  محتوى البداية — الأخبار / اللينكات / السياسات / الأحداث / قائمة البوفيه
--  شغّله مرة واحدة بس (الجداول لازم تكون فاضية). لو شغّلته مرتين
--  هيتكرر المحتوى، لأن مفيش قيد بيمنع التكرار عمدًا (أبسط كده).
-- ══════════════════════════════════════════════════════════════

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
