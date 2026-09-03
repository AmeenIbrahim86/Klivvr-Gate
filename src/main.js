/**
 * main.js — البوابة (بدون شاشة البوفيه، دي في kitchen.js لوحدها)
 *
 * كل قراءة وكتابة بتمر من src/api.js. التطبيق نفسه مش عارف حاجة عن Supabase.
 * تسجيل الدخول حقيقي (Microsoft عن طريق Supabase Auth)، والصلاحيات المعروضة هنا
 * (إخفاء/تعطيل الأزرار) هي راحة بصرية بس — الإنفاذ الحقيقي في RLS جوه الـ database،
 * يعني حتى لو حد لعب في الـ DevTools مش هيقدر يكتب في قسم مالوش صلاحية عليه.
 */
import * as api from './api.js';

/* ═══════════════ copy ═══════════════ */
const L = { ar: {
 portal:"البوابة",order:"اطلب من البوفيه",admin:"الإدارة",
 sitename:"بوابة كليفر",mark:"ب",
 news:"أخبار الشركة",links:"لينكات سريعة",docs:"السياسات الداخلية",events:"الأحداث القادمة",
 viewall:"عرض الكل",calendar:"التقويم",
 bandT:"محتاج شاي أو قهوة؟",bandB:"اطلب من مكتبك، وطلبك يظهر على شاشة البوفيه في ثواني.",bandC:"اطلب دلوقتي ←",
 all:"الكل",
 sugar:"السكر",qty:"الكمية",notePH:"ملاحظة (اختياري)",addTo:"ضيف للطلب",
 milk:"اللبن",withMilk:"بلبن",noMilk:"من غير لبن",hasMilk:"له اختيار لبن",
 yourOrder:"طلبك",emptyCart:"لسه مضفتش حاجة",emptyCartB:"اختار من القائمة على الجنب",send:"ادفع الآن",cur:"ج.م",
 payTitle:"ادفع عن طريق InstaPay",payHint:"امسح الكود بتطبيق InstaPay وحوّل قيمة الطلب، وبعدين دوس تأكيد.",payConfirm:"تم الدفع، تأكيد الطلب",payBack:"رجوع للسلة",
 where:"مكانك",wherePH:"مثال: مكتب ٣١٢",whereOffice:"مكتب",whereRoom:"قاعة اجتماعات",wherePickRoom:"اختار القاعة…",
 overview:"نظرة عامة",aNews:"الأخبار",aLinks:"اللينكات",aPolicies:"السياسات",aEvents:"الأحداث",aMenu:"قائمة البوفيه",aAccess:"الصلاحيات",sites:"المواقع",
 orgChart:"الهيكل التنظيمي",orgSync:"مزامنة من Entra ID",orgSyncing:"بيزامن…",orgSynced:"اتزامن",orgEmpty:"لسه مفيش داتا — دوس مزامنة من Entra ID",
 gallery:"معرض الصور",galleryEmpty:"لسه مفيش صور",uploadPhoto:"رفع صورة",uploading:"بيترفع…",
 captionPH:"وصف الصورة (اختياري)",galleryAdded:"اتضافت الصورة",galleryDeleted:"اتمسحت الصورة",
 galleryConfirmDel:"متأكد إنك عايز تمسح الصورة دي؟",imageUploading:"بيترفع الصورة…",imageUploaded:"اتحطت",
 imageRemove:"شيل الصورة",uploadIcon:"رفع أيقونة مخصصة",
 addBranch:"إضافة فرع",branchId:"كود الفرع",branchIdHint:"حروف إنجليزي صغيرة، مثال: alex",
 branchLive:"الحالة",branchLiveYes:"شغّال",branchLiveNo:"قريباً",
 branchQr:"كود InstaPay",nameArHint:"الاسم بالعربي (اختياري)",isFree:"مجاني",free:"مجاني",
 myOrders:"طلباتي",reasonUnavailable:"غير متوفر",reasonOutOfStock:"خلص من المخزون",reasonOtherPH:"سبب تاني...",
 confirmReject:"تأكيد الرفض",statusNew:"جديد",statusPreparing:"بيتحضّر",statusDelivered:"اتسلّم",statusRejected:"مرفوض",
 rejectedBecause:"سبب الرفض",noOrdersYet:"لسه معملتش أي طلب",
 autoTranslateAll:"ترجمة تلقائية للكل",autoTranslateNone:"كل الأسماء متعرّبة بالفعل",autoTranslateDone:"اتعرّبت الأسماء",
 branchIdInvalid:"كود الفرع لازم يكون حروف/أرقام إنجليزي بس، من غير مسافات",
 branchNamesRequired:"لازم اسم بالعربي والإنجليزي",branchDeleteConfirm:"متأكد؟ لو الفرع ده عليه أصناف أو طلبات مش هينمسح.",
 aboutEmpty:"لسه مفيش وصف — دوس ✎ تكتب واحد",aboutAR:"الوصف بالعربي",aboutEN:"الوصف بالإنجليزي",
 eventDateTime:"تاريخ ووقت الحدث (لينك Outlook)",addToOutlook:"أضف لتقويم Outlook",
 orgSearchPH:"دوّر بالاسم…",orgSearchBtn:"بحث",orgNotFound:"ملقيتش حد بالاسم ده",
 add:"إضافة",save:"حفظ",cancel:"إلغاء",
 tag:"التصنيف",titleAR:"العنوان بالعربي",titleEN:"العنوان بالإنجليزي",bodyAR:"النص بالعربي",bodyEN:"النص بالإنجليزي",
 author:"الكاتب",date:"التاريخ",icon:"الأيقونة",url:"اللينك",dept:"القسم",version:"الإصدار",
 image:"لينك الصورة",imageHint:"الصق لينك صورة من الإنترنت (اختياري)",
 place:"المكان",day:"اليوم",month:"الشهر",cat:"التصنيف",price:"السعر",hasSugar:"له اختيارات سكر",avail:"متاح",color:"اللون",
 branch:"الفرع",allBranches:"كل الفروع",branches:"الفروع",role:"الدور",people:"الناس",
 whichBranch:"انت في أنهي فرع؟",whichBranchB:"عشان الطلب يروح لبوفيه الفرع الصح.",
 youAt:"انت في",change:"غيّر",itemsAvail:"صنف متاح",
 branchNote:"البوفيه بس اللي بيتقسم فروع — باقي البوابة واحدة للشركة كلها.",
 kioskTitle:"شاشات البوفيه",kioskNote:"اللينك عادي ومش سري — الحماية بالباسورد بس.",
 kioskNewPw:"باسورد جديد",pwSaved:"اتغيّر الباسورد",pwTooShort:"لازم ٤ حروف على الأقل",
 noPerm:"مالكش صلاحية على القسم ده",
 permNote:"علّم الخانة تدّي الدور صلاحية تعديل القسم. صف الأدمن مقفول عشان محدش يشيل عن نفسه الوصول بالغلط.",
 saved:"اتحفظ",deleted:"اتحذف",errGeneric:"حصل خطأ، جرب تاني",
 openOrders:"طلبات مفتوحة",todayOrders:"طلبات النهاردة",newsCount:"خبر منشور",policyCount:"سياسة",
 soon:"قريباً",canEdit:"بيعدّل",
 signInSub:"سجّل دخولك بحساب الشركة على Microsoft.",signInBtn:"تسجيل الدخول بحساب Microsoft",
 signOut:"خروج",loading:"بيحمّل…",
 loadErr:"حصلت مشكلة في تحميل البيانات. حدّث الصفحة أو كلّم الـ IT.",reload:"حدّث الصفحة",
 confirmTitle:"وصل طلبك للبوفيه",confirmBody:"الفريق استلم طلبك وهيبدأ يجهّزه.",
 confirmBack:"رجوع للبوابة",confirmAnother:"اطلب حاجة تانية",
 noBranch:"مش متعيّن على فرع دلوقتي — كلّم الأدمن يحطك في فرع.",
},en:{
 portal:"Portal",order:"Order from buffet",admin:"Admin",
 sitename:"Klivvr Gate",mark:"P",
 news:"Company news",links:"Quick links",docs:"Internal policies",events:"Upcoming events",
 viewall:"View all",calendar:"Calendar",
 bandT:"Need a tea or a coffee?",bandB:"Order from your desk. It lands on the buffet screen in seconds.",bandC:"Order now →",
 all:"All",
 sugar:"Sugar",qty:"Quantity",notePH:"Note (optional)",addTo:"Add to order",
 milk:"Milk",withMilk:"With milk",noMilk:"No milk",hasMilk:"Has milk option",
 yourOrder:"Your order",emptyCart:"Nothing added yet",emptyCartB:"Pick something from the menu",send:"Pay now",cur:"EGP",
 payTitle:"Pay via InstaPay",payHint:"Scan the code in the InstaPay app and transfer the order total, then confirm.",payConfirm:"Paid — confirm order",payBack:"Back to cart",
 where:"Where you are",wherePH:"e.g. Office 312",whereOffice:"Office",whereRoom:"Meeting room",wherePickRoom:"Pick a room…",
 overview:"Overview",aNews:"News",aLinks:"Quick links",aPolicies:"Policies",aEvents:"Events",aMenu:"Buffet menu",aAccess:"Access",sites:"Sites",
 orgChart:"Org chart",orgSync:"Sync from Entra ID",orgSyncing:"Syncing…",orgSynced:"Synced",orgEmpty:"No data yet — click sync from Entra ID",
 gallery:"Gallery",galleryEmpty:"No photos yet",uploadPhoto:"Upload photo",uploading:"Uploading…",
 captionPH:"Photo caption (optional)",galleryAdded:"Photo added",galleryDeleted:"Photo deleted",
 galleryConfirmDel:"Delete this photo?",imageUploading:"Uploading photo…",imageUploaded:"Added",
 imageRemove:"Remove photo",uploadIcon:"Upload custom icon",
 addBranch:"Add branch",branchId:"Branch code",branchIdHint:"Lowercase letters, e.g. alex",
 branchLive:"Status",branchLiveYes:"Live",branchLiveNo:"Coming soon",
 branchQr:"InstaPay QR code",nameArHint:"Arabic name (optional)",isFree:"Free item",free:"Free",
 myOrders:"My orders",reasonUnavailable:"Not available",reasonOutOfStock:"Out of stock",reasonOtherPH:"Other reason...",
 confirmReject:"Confirm rejection",statusNew:"New",statusPreparing:"Preparing",statusDelivered:"Delivered",statusRejected:"Rejected",
 rejectedBecause:"Rejected because",noOrdersYet:"You haven't placed any orders yet",
 autoTranslateAll:"Auto-translate all",autoTranslateNone:"All names already have an Arabic version",autoTranslateDone:"Names translated",
 branchIdInvalid:"Branch code must be lowercase letters/numbers only, no spaces",
 branchNamesRequired:"Both Arabic and English names are required",branchDeleteConfirm:"Delete this branch? It won't delete if it still has menu items or orders.",
 aboutEmpty:"No description yet — click ✎ to write one",aboutAR:"Description (Arabic)",aboutEN:"Description (English)",
 eventDateTime:"Event date & time (for Outlook link)",addToOutlook:"Add to Outlook calendar",
 orgSearchPH:"Search by name…",orgSearchBtn:"Search",orgNotFound:"No one found with that name",
 add:"Add",save:"Save",cancel:"Cancel",
 tag:"Tag",titleAR:"Title (Arabic)",titleEN:"Title (English)",bodyAR:"Body (Arabic)",bodyEN:"Body (English)",
 author:"Author",date:"Date",icon:"Icon",url:"Link",dept:"Department",version:"Version",
 image:"Image link",imageHint:"Paste an image link from the internet (optional)",
 place:"Place",day:"Day",month:"Month",cat:"Category",price:"Price",hasSugar:"Has sugar options",avail:"Available",color:"Colour",
 branch:"Branch",allBranches:"All branches",branches:"Branches",role:"Role",people:"People",
 whichBranch:"Which branch are you at?",whichBranchB:"So the order reaches the right buffet.",
 youAt:"You're at",change:"Change",itemsAvail:"items available",
 branchNote:"Only the buffet is split by branch — the rest of the portal is company-wide.",
 kioskTitle:"Buffet screens",kioskNote:"The link itself isn't secret — the password is what protects it.",
 kioskNewPw:"New password",pwSaved:"Password updated",pwTooShort:"Must be at least 4 characters",
 noPerm:"You don't have access to this section",
 permNote:"Tick a box to let that role edit that section. The admin row is locked so nobody can remove their own way back in.",
 saved:"Saved",deleted:"Deleted",errGeneric:"Something went wrong, try again",
 openOrders:"Open orders",todayOrders:"Orders today",newsCount:"Published news",policyCount:"Policies",
 soon:"Coming soon",canEdit:"Can edit",
 signInSub:"Sign in with your company Microsoft account.",signInBtn:"Sign in with Microsoft",
 signOut:"Sign out",loading:"Loading…",
 loadErr:"Something went wrong loading data. Refresh or contact IT.",reload:"Reload",
 confirmTitle:"Your order is with the buffet",confirmBody:"The team has received your order and will start preparing it.",
 confirmBack:"Back to portal",confirmAnother:"Order something else",
 noBranch:"You're not assigned to a branch yet — ask an admin to set one.",
}};

const SECTIONS = ["news","links","policies","events","menu","orders","access","gallery"];
const CATS = [
 {k:"all",ar:"الكل",en:"All"},
 {k:"free",ar:"مجاني",en:"Free"},
 {k:"snacks",ar:"كيك وحلويات",en:"Snack Cakes"},
 {k:"biscuits",ar:"بسكويت وكوكيز",en:"Biscuits & Cookies"},
 {k:"protein",ar:"بروتين بار",en:"Protein Bars"},
 {k:"chips",ar:"شيبسي وكراكرز",en:"Chips & Crackers"},
 {k:"drinks",ar:"مشروبات",en:"Beverages"},
 {k:"sandwiches",ar:"سندوتشات",en:"Sandwiches"}];
const SUG = [{ar:"سادة",en:"None"},{ar:"خفيف",en:"Light"},{ar:"مظبوط",en:"Medium"},{ar:"زيادة",en:"Extra"}];
const ROOMS = ["Dusk","Dawn","Skyline","Golden Hour","Whisper 1","Whisper 2","Whisper 3","Whisper 4",
  "Whisper 5","Whisper 6","Board Room","New Dawn","Euphoria","Liberty"];

// تحويل تلقائي تقريبي من الاسم بالإنجليزي للعربي — قاموس لأشهر الأسماء المصرية/العربية،
// وتحويل صوتي بسيط لأي اسم مش في القاموس. مش مثالي ١٠٠٪، بس بيوفّر الكتابة اليدوية
// في الغالبية العظمى من الحالات، وبيفضل قابل للتعديل اليدوي بعد كده لو غلط.
const NAME_DICT = {
  mohamed:"محمد",mohammed:"محمد",muhammad:"محمد",ahmed:"أحمد",ahmad:"أحمد",mahmoud:"محمود",mahmood:"محمود",
  ibrahim:"إبراهيم",ebrahim:"إبراهيم",omar:"عمر",amr:"عمرو",ali:"علي",hassan:"حسن",hussein:"حسين",husein:"حسين",
  khaled:"خالد",khalid:"خالد",tarek:"طارق",tariq:"طارق",sherif:"شريف",sharif:"شريف",karim:"كريم",kareem:"كريم",
  yousef:"يوسف",youssef:"يوسف",yusuf:"يوسف",amin:"أمين",ameen:"أمين",sameh:"سامح",sami:"سامي",samy:"سامي",
  tamer:"تامر",waleed:"وليد",walid:"وليد",wael:"وائل",hany:"هاني",hani:"هاني",ashraf:"أشرف",medhat:"مدحت",
  hazem:"حازم",hisham:"هشام",hesham:"هشام",gamal:"جمال",jamal:"جمال",fady:"فادي",adel:"عادل",essam:"عصام",
  islam:"إسلام",ehab:"إيهاب",eslam:"إسلام",mostafa:"مصطفى",mustafa:"مصطفى",moustafa:"مصطفى",ayman:"أيمن",
  amir:"أمير",ameer:"أمير",fady2:"فادي",ramy:"رامي",rami:"رامي",bassem:"باسم",basem:"باسم",magdy:"مجدي",
  raafat:"رأفت",rafaat:"رأفت",sameer:"سمير",samir:"سمير",salah:"صلاح",mazen:"مازن",fouad:"فؤاد",foad:"فؤاد",
  nabil:"نبيل",medo:"ميدو",abdo:"عبده",abdelrahman:"عبدالرحمن",abdulrahman:"عبدالرحمن",abdallah:"عبدالله",
  abdullah:"عبدالله",abdelaziz:"عبدالعزيز",abdelmoneim:"عبدالمنعم",abdelfattah:"عبدالفتاح",moataz:"معتز",
  emad:"عماد",imad:"عماد",kamal:"كمال",galal:"جلال",fathy:"فتحي",saeed:"سعيد",said:"سعيد",hosny:"حسني",
  mina:"مينا",peter:"بيتر",george:"جورج",joseph:"جوزيف",andrew:"أندرو",mark:"مارك",
  sara:"سارة",sarah:"سارة",mariam:"مريم",maryam:"مريم",nour:"نور",noor:"نور",mona:"منى",hala:"هالة",
  dina:"دينا",dalia:"داليا",rania:"رانيا",rana:"رنا",yasmin:"ياسمين",yasmine:"ياسمين",heba:"هبة",
  hoda:"هدى",amira:"أميرة",ameera:"أميرة",salma:"سلمى",laila:"ليلى",layla:"ليلى",fatma:"فاطمة",
  fatima:"فاطمة",aya:"آية",ayah:"آية",farida:"فريدة",jana:"جنى",habiba:"حبيبة",malak:"ملك",
  nada:"ندى",nadia:"نادية",reem:"ريم",rim:"ريم",asmaa:"أسماء",asma:"أسماء",eman:"إيمان",iman:"إيمان",
  shaimaa:"شيماء",shorouk:"شروق",samar:"سمر",marwa:"مروة",radwa:"رضوى",esraa:"إسراء",israa:"إسراء",
  ibrahim2:"إبراهيم",fahmy:"فهمي",naguib:"نجيب",farag:"فرج",zaki:"زكي",farghaly:"فرغلي",elgarhy:"الجارحي",
  abdo2:"عبده",arous:"عروس",albaroudy:"الباروودي",sherif2:"شريف",hadhod:"هدهد",awad:"عوض",hassan2:"حسن",
  gouda:"جودة",elshamy:"الشامي",sallam:"سلام",gomaa:"جمعة",fouad2:"فؤاد",ghali:"غالي",wahba:"وهبة",
  aboul:"أبو",abou:"أبو",abu:"أبو",elsayed:"السيد",sayed:"سيد",sayyed:"سيد",hafez:"حافظ",soliman:"سليمان",
  suleiman:"سليمان",attia:"عطية",kandil:"قنديل",sabry:"صبري",lotfy:"لطفي",fikry:"فكري",labib:"لبيب",
  hegazy:"حجازي",hegazi:"حجازي",youssry:"يسري",amer:"عامر",gaber:"جابر",gabr:"جبر",naeem:"نعيم",
  nasr:"نصر",farouk:"فاروق",farouq:"فاروق",anwar:"أنور",zaghloul:"زغلول",badawy:"بدوي",shawky:"شوقي"
};
function translitWord(w){
  const key=w.toLowerCase().replace(/[^a-z]/g,"");
  if(NAME_DICT[key]) return NAME_DICT[key];
  // تحويل صوتي تقريبي لأي كلمة مش في القاموس
  let s=w.toLowerCase();
  const multi=[["kh","خ"],["gh","غ"],["sh","ش"],["th","ث"],["dh","ذ"],["ch","تش"],["ph","ف"],
    ["ee","ي"],["oo","و"],["aa","ا"],["ou","و"],["ei","ي"],["ai","اي"],["ny","ني"]];
  for(const[a,b]of multi) s=s.split(a).join("§"+b+"§");
  const map={a:"ا",b:"ب",t:"ت",g:"ج",j:"ج",h:"ه",d:"د",r:"ر",z:"ز",s:"س",f:"ف",q:"ق",k:"ك",
    l:"ل",m:"م",n:"ن",w:"و",y:"ي",x:"كس",c:"ك",v:"ف",u:"و",o:"و",i:"ي",e:"ي","'":"ع"};
  let out="";
  for(const ch of s){
    if(ch==="§"){continue}
    out += map[ch] ?? "";
  }
  return out||w;
}
function transliterateToArabic(fullName){
  return (fullName||"").trim().split(/\s+/).map(translitWord).join(" ");
}
const TABS = [["overview","overview","▦",null],["news","aNews","✦","news"],["links","aLinks","◫","links"],
 ["policies","aPolicies","▤","policies"],["events","aEvents","▣","events"],["menu","aMenu","☕","menu"],
 ["access","aAccess","⚿","access"]];
const ICON_PRESETS = ["✉️","📅","📁","⚙️","🏢","📊","💰","🎯","📋","🔔","📞","🗂️","🧑‍💻","📦","🧾","🛠️"];
const isUrl=s=>/^https?:\/\//.test(s||"");
const iconHtml=icon=>isUrl(icon)?`<img src="${esc(icon)}" class="qicon-img">`:esc(icon||"");
function toLocalInput(iso){
  const d=new Date(iso);
  const pad=n=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function outlookLink(e){
  if(!e.startsAt) return null;
  const start=new Date(e.startsAt), end=new Date(start.getTime()+60*60000);
  const iso=d=>d.toISOString().replace(/\.\d{3}Z$/,"Z");
  const params=new URLSearchParams({
    path:"/calendar/action/compose", rru:"addevent",
    subject:nm(e), startdt:iso(start), enddt:iso(end),
    location: lang==="ar"?(e.placeAR||""):(e.placeEN||"")
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}
function swatchHtml(m,size){
  size=size||38;
  const shape=m.sq?"sq":"";
  if(m.icon){
    return isUrl(m.icon)
      ?`<span class="swatch ${shape}" style="width:${size}px;height:${size}px"><img src="${esc(m.icon)}" style="width:100%;height:100%;object-fit:cover"></span>`
      :`<span class="swatch ${shape}" style="width:${size}px;height:${size}px;background:var(--peri-soft);display:grid;place-items:center;font-size:${Math.round(size*0.55)}px">${esc(m.icon)}</span>`;
  }
  return `<span class="swatch ${shape}" style="width:${size}px;height:${size}px"><i style="background:${esc(m.col)};${m.sq?"height:100%":""}"></i></span>`;
}
const FIELDS = {
 news:[["tagAR","tag"],["tagEN","tag"],["titleAR","titleAR"],["titleEN","titleEN"],["bodyAR","bodyAR",1],["bodyEN","bodyEN",1],["author","author"],["date","date"],["image","image"]],
 links:[["ar","titleAR"],["en","titleEN"],["icon","icon"],["url","url"]],
 policies:[["ar","titleAR"],["en","titleEN"],["dept","dept"],["ver","version"],["date","date"],["url","url"]],
 events:[["ar","titleAR"],["en","titleEN"],["placeAR","place"],["placeEN","place"],["day","day"],["monAR","month"],["monEN","month"],["startsAt","eventDateTime"],["image","image"]],
 menu:[["ar","titleAR"],["en","titleEN"],["price","price"],["col","color"],["icon","icon"]]};

/* ═══════════════ state ═══════════════ */
let lang="en", authed=false, view="portal", tab="overview";
let myProfile=null, SITES=[], C={news:[],links:[],policies:[],events:[]}, M=[], O=[], A={roles:[],users:[]}, ORG=[], GALLERY=[];
let ABOUT={ar:"",en:""}, aboutEditing=false;
let MY_ORDERS=null;
let branch=null, paying=false, lastOrderNo="";
let cart=[], openM=null, draft={}, cat="all", where="", whereType="office", whereRoom="", edit=null, eKind=null;

const t=k=>L[lang][k]??k;
const nm=o=>o?(o[lang]??o.ar??o.en??""):"";
const num=n=>Number(n).toLocaleString(lang==="ar"?"ar-EG":"en-US");
const money=n=>num(n)+" "+t("cur");
const effPrice=m=>m.free?0:m.price;
const priceLabel=m=>m.free?t("free"):money(m.price);
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const role=()=>A.roles.find(r=>r.id===myProfile?.role)||{perms:[]};
const can=s=>role().perms.includes(s);
const so=id=>SITES.find(s=>s.id===id)||{id,ar:"—",en:"—",live:false};
const LIVE=()=>SITES.filter(s=>s.live);
const inBranch=(x,b)=>!x.site||x.site==="all"||x.site===b;
const mi=id=>M.find(m=>m.id===id)||{ar:"—",en:"—",price:0};
const catLabel=k=>{const c=CATS.find(x=>x.k===k);return c?nm(c):k};
const dots=n=>`<span class="dots">${[0,1,2].map(i=>`<i class="${i<n?"on":""}"></i>`).join("")}</span>`;
const secLbl=s=>t(s==="news"?"aNews":s==="links"?"aLinks":s==="policies"?"aPolicies":s==="events"?"aEvents":s==="menu"?"aMenu":s==="orders"?"aOrders":s==="gallery"?"gallery":"aAccess");

function toast(m){const e=$("#toast");if(!e)return;e.textContent=m;e.classList.add("show");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("show"),2200)}
function fail(e){console.error(e);toast(t("errGeneric"))}

/* ═══════════════ boot / auth ═══════════════ */
async function loadEverything(){
  myProfile = await api.loadMe();
  // لو مفيش اسم عربي متسجّل، جرّب تحويل تلقائي واحفظه مرة واحدة (يفضل قابل للتعديل بعد كده)
  if(myProfile && myProfile.ar===myProfile.en){
    const guess=transliterateToArabic(myProfile.en);
    if(guess){ myProfile.ar=guess; api.setFullNameAr(myProfile.id, guess).catch(()=>{}); }
  }
  const results = await Promise.allSettled([
    api.listBranches(), api.loadRoles(), api.list("news"), api.list("links"),
    api.list("policies"), api.list("events"), api.list("menu"),
    api.listProfiles(), api.listOrders(), api.listOrgPeople(), api.listGallery(),
    api.getSetting("about")
  ]);
  results.forEach((r,i)=>{ if(r.status==="rejected") console.error("load section", i, "failed:", r.reason); });
  const val=(i,fallback)=>results[i].status==="fulfilled"?results[i].value:fallback;
  SITES=val(0,[]); A={roles:val(1,[]),users:val(7,[])};
  C={news:val(2,[]),links:val(3,[]),policies:val(4,[]),events:val(5,[])};
  M=val(6,[]); O=val(8,[]); ORG=val(9,[]); GALLERY=val(10,[]); ABOUT=val(11,{ar:"",en:""});
}
async function start(session){
  if(!session){ authed=false; myProfile=null; renderSignIn(); return; }
  if(authed) return; // already booted for this session
  renderLoading();
  try{ await loadEverything(); authed=true; render(); }
  catch(e){ renderError(e); }
}
api.auth.onChange(session=>start(session));
api.auth.session().then(start);

function doSignIn(){ api.auth.signInMicrosoft(); }
function doSignOut(){ api.auth.signOut(); }

/* ═══════════════ render ═══════════════ */
function render(){
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  if(!authed){ renderSignIn(); return; }
  $("#app").innerHTML = shell(
    view==="confirmed" ? vConfirmed() :
    view==="portal" ? vPortal() :
    view==="order" ? vOrder() :
    view==="org" ? vOrg() :
    view==="gallery" ? vGallery() :
    view==="myorders" ? vMyOrders() : vAdmin()
  );
}
function renderSignIn(){
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  $("#app").innerHTML = `<div class="signin"><div class="signin-card">
    <img src="/klivvr-icon.png" alt="Klivvr" style="width:52px;height:52px;border-radius:15px;margin:0 auto 16px;display:block">
    <h1>${t("sitename")}</h1>
    <p>${t("signInSub")}</p>
    <button class="btn" style="width:100%;margin-top:20px" onclick="doSignIn()">${t("signInBtn")}</button>
    <span class="signin-lang">
      <button class="${lang==="ar"?"on":""}" onclick="setLang('ar')">ع</button>
      <button class="${lang==="en"?"on":""}" onclick="setLang('en')">EN</button></span>
    <img src="/klivvr-wordmark.svg" alt="klivvr" class="signin-wordmark">
  </div></div>`;
}
function renderLoading(){
  $("#app").innerHTML = `<div class="signin"><div class="signin-card"><p>${t("loading")}</p></div></div>`;
}
function renderError(e){
  console.error(e);
  $("#app").innerHTML = `<div class="signin"><div class="signin-card">
    <p>${t("loadErr")}</p>
    <button class="btn ghost" style="width:100%;margin-top:14px" onclick="location.reload()">${t("reload")}</button>
  </div></div>`;
}
function shell(inner){
  const tabs=[["order",t("order")]];
  if(role().perms.length)tabs.push(["admin",t("admin")]);
  return `<div class="topbar">
    <button class="brand" onclick="go('portal')"><img src="/klivvr-icon.png" alt="Klivvr" class="logomark"><b>${t("sitename")}</b></button>
    <nav class="topnav">${tabs.map(([k,v])=>`<button class="${view===k?"on":""}" onclick="go('${k}')">${v}</button>`).join("")}
      <span class="langsw"><button class="${lang==="ar"?"on":""}" onclick="setLang('ar')">ع</button>
      <button class="${lang==="en"?"on":""}" onclick="setLang('en')">EN</button></span>
      <button class="signout" onclick="doSignOut()" title="${t("signOut")}">${esc(nm(myProfile))} ⎋</button>
    </nav></div>
    <div class="wrap">${inner}</div>`;
}
function go(v){view=v;edit=null;paying=false;if(v==="myorders")loadMyOrders();render();scrollTo({top:0,behavior:"instant"})}
async function loadMyOrders(){
  try{ MY_ORDERS=await api.myOrders(); }catch(e){ console.error(e); MY_ORDERS=[]; }
  render();
}
function setLang(l){lang=l;render()}
function setBranch(b){if(!so(b).live)return;branch=b;cart=[];paying=false;render()}
function changeBranch(){branch=null;cart=[];paying=false;render()}
function setCat(c){cat=c;openM=null;render()}
function setWhere(v){where=v}
function setWhereType(v){whereType=v;render()}
function setWhereRoom(v){whereRoom=v;render()}

/* ═══════════════ portal ═══════════════ */
function aboutCard(){
  const txt=lang==="ar"?ABOUT.ar:ABOUT.en;
  if(!txt&&!can("news")&&!can("access")) return "";
  return `<div class="about-card">
    <h2>${esc(t("sitename"))}</h2>
    <p>${esc(txt)||t("aboutEmpty")}</p>
    ${(can("news")||can("access"))?`<button class="about-edit-btn" onclick="startAboutEdit()" title="${t("save")}">✎</button>`:""}
  </div>`;
}
function aboutForm(){
  return `<div class="card" style="margin-bottom:18px">
    <div class="fgrid" style="margin-bottom:10px;padding:16px 16px 0">
      <div class="fld"><label>${t("aboutAR")}</label>
        <textarea class="inp" id="aboutArInput" style="min-height:70px">${esc(ABOUT.ar)}</textarea></div>
      <div class="fld"><label>${t("aboutEN")}</label>
        <textarea class="inp" id="aboutEnInput" style="min-height:70px">${esc(ABOUT.en)}</textarea></div>
    </div>
    <div class="formacts" style="padding:0 16px 16px"><button class="btn sm" onclick="saveAbout()">${t("save")}</button>
      <button class="btn ghost sm" onclick="cancelAboutEdit()">${t("cancel")}</button></div>
  </div>`;
}
function startAboutEdit(){ aboutEditing=true; render(); }
function cancelAboutEdit(){ aboutEditing=false; render(); }
async function saveAbout(){
  const ar=$("#aboutArInput")?.value.trim()||"", en=$("#aboutEnInput")?.value.trim()||"";
  try{
    await api.setSetting("about", ar, en);
    ABOUT={ar,en}; aboutEditing=false; toast(t("saved")); render();
  }catch(e){ fail(e); }
}
function vPortal(){
  const news=C.news,lead=news[0],rest=news.slice(1,4);
  const links=C.links,pol=C.policies,ev=C.events;
  return `${aboutEditing?aboutForm():aboutCard()}
  <div class="eyebrow">${t("news")}</div>
  ${lead?`<div class="hero ${lead.image?"has-photo":""}" ${lead.image?`style="background-image:url('${esc(lead.image)}')"`:""}>
    <div class="hero-main"><span class="pill">${esc(lang==="ar"?lead.tagAR:lead.tagEN)}</span>
      <h2>${esc(lang==="ar"?lead.titleAR:lead.titleEN)}</h2>
      <p>${esc(lang==="ar"?lead.bodyAR:lead.bodyEN)}</p>
      <div class="by">${esc(lead.author)} · <span class="mono">${esc(lead.date)}</span></div></div>
    <div class="hero-side">${rest.map(n=>`<button>${n.image?`<img src="${esc(n.image)}" class="news-thumb">`:""}
      <span class="hero-side-txt"><h4>${esc(lang==="ar"?n.titleAR:n.titleEN)}</h4>
      <span>${esc(lang==="ar"?n.tagAR:n.tagEN)} · ${esc(n.date)}</span></span></button>`).join("")||
      `<div style="color:#A5A2CB;font-size:12.5px;text-align:center">—</div>`}</div></div>`
   :`<div class="card empty"><b>${t("news")}</b>—</div>`}

  <div class="eyebrow" style="margin-top:26px">${t("links")}</div>
  <div class="qgrid"><button class="qtile feat" onclick="go('order')"><span class="qicon">☕</span>${t("order")}</button>
    <button class="qtile feat" onclick="go('org')"><span class="qicon">🧭</span>${t("orgChart")}</button>
    <button class="qtile feat" onclick="go('gallery')"><span class="qicon">🖼️</span>${t("gallery")}</button>
    <button class="qtile feat" onclick="go('myorders')"><span class="qicon">🧾</span>${t("myOrders")}</button>
    ${links.map(l=>`<a class="qtile" href="${esc(l.url||"#")}"><span class="qicon">${iconHtml(l.icon)}</span>${esc(nm(l))}</a>`).join("")}</div>

  <div class="eyebrow" style="margin-top:26px">${t("docs")} · ${t("events")}</div>
  <div class="twocol">
    <div class="card"><div class="ph"><h3>${t("docs")}</h3><a href="#">${t("viewall")}</a></div>
      ${pol.length?pol.map(p=>p.url?`<a class="row" href="${esc(p.url)}" target="_blank" rel="noopener"><span class="dicon"></span>
        <div><b>${esc(nm(p))}</b><div class="sub">${esc(p.dept)}</div></div>
        <div class="meta"><span class="mono">v${esc(p.ver)}</span><br>${esc(p.date)}</div></a>`
       :`<div class="row"><span class="dicon"></span>
        <div><b>${esc(nm(p))}</b><div class="sub">${esc(p.dept)}</div></div>
        <div class="meta"><span class="mono">v${esc(p.ver)}</span><br>${esc(p.date)}</div></div>`).join("")
       :`<div class="empty"><b>—</b>${t("docs")}</div>`}</div>
    <div class="card"><div class="ph"><h3>${t("events")}</h3><a href="#">${t("calendar")}</a></div>
      ${ev.length?ev.map(e=>`<div class="row">
        <div class="datechip"><div class="m">${esc(lang==="ar"?e.monAR:e.monEN)}</div><div class="d mono">${esc(e.day)}</div></div>
        ${e.image?`<img src="${esc(e.image)}" class="evt-thumb">`:""}
        <div style="flex:1"><b>${esc(nm(e))}</b><div class="sub">${esc(lang==="ar"?e.placeAR:e.placeEN)}</div></div>
        ${outlookLink(e)?`<a class="evt-outlook" href="${outlookLink(e)}" target="_blank" rel="noopener" title="${t("addToOutlook")}">📅</a>`:""}
        </div>`).join("")
       :`<div class="empty"><b>—</b>${t("events")}</div>`}</div></div>

  <div class="eyebrow" style="margin-top:26px">${t("gallery")}</div>
  <div class="card"><div class="ph"><h3>${t("gallery")}</h3><a href="#" onclick="go('gallery');return false">${t("viewall")}</a></div>
    ${GALLERY.length?`<div class="gal-grid gal-grid-sm" style="padding:16px">${GALLERY.slice(0,6).map(g=>`<div class="gal-item">
        <img src="${esc(g.url)}" loading="lazy">
        ${g.caption?`<div class="gal-cap">${esc(g.caption)}</div>`:""}</div>`).join("")}</div>`
     :`<div class="empty"><b>—</b>${t("galleryEmpty")}</div>`}</div>

  <div class="band"><div><h2>${t("bandT")}</h2><p>${t("bandB")}</p></div>
    <button class="btn" onclick="go('order')">${t("bandC")}</button></div>`;
}

/* ═══════════════ order ═══════════════ */
function vOrder(){
  if(!branch)return vPickBranch();
  const list=M.filter(m=>inBranch(m,branch)&&m.avail&&(cat==="all"||(cat==="free"?m.free:m.cat===cat)));
  const tot=cart.reduce((a,c)=>a+effPrice(mi(c.m))*c.q,0);
  return `<div class="eyebrow">${t("order")}</div>
  <div class="atbr"><span>${t("youAt")} <b>${esc(nm(so(branch)))}</b></span>
    <button onclick="changeBranch()">${t("change")}</button></div>
  <div class="ordwrap"><div>
    <div class="cats">${CATS.map(c=>
      `<button class="${cat===c.k?"on":""}" onclick="setCat('${c.k}')">${esc(nm(c))}</button>`).join("")}</div>
    <div class="mgrid">${list.map(m=>{const o=openM===m.id,d=draft[m.id]||{q:1,s:2,milk:false,note:""};
      return `<div class="mitem ${o?"open":""}">
        <button class="mrow" onclick="tog('${m.id}')">
          ${swatchHtml(m,38)}
          <span class="nm"><b>${esc(nm(m))}</b><span>${esc(catLabel(m.cat))}</span></span>
          <span class="price">${priceLabel(m)}</span><span class="plus">+</span></button>
        <div class="opts">
          ${m.sugar?`<div class="optlbl">${t("sugar")}</div><div class="sugars">${SUG.map((s,i)=>
            `<button class="sugar ${d.s===i?"on":""}" onclick="setSug('${m.id}',${i})">${dots(i)}<em>${esc(nm(s))}</em></button>`).join("")}</div>`:""}
          ${m.milk?`<div class="optlbl">${t("milk")}</div><div class="sugars">
            <button class="sugar ${!d.milk?"on":""}" onclick="setMilk('${m.id}',false)">🥛<em>${t("noMilk")}</em></button>
            <button class="sugar ${d.milk?"on":""}" onclick="setMilk('${m.id}',true)">🥛<em>${t("withMilk")}</em></button>
          </div>`:""}
          <div class="optlbl">${t("qty")}</div>
          <div class="qtyrow"><div class="stepper">
            <button onclick="stp('${m.id}',-1)">−</button><span class="v">${num(d.q)}</span><button onclick="stp('${m.id}',1)">+</button></div>
            <input class="inp" placeholder="${t("notePH")}" value="${esc(d.note)}" oninput="setNote('${m.id}',this.value)"></div>
          <button class="addbtn" onclick="addCart('${m.id}')">${t("addTo")} · ${m.free?t("free"):money(m.price*d.q)}</button>
        </div></div>`}).join("")||`<div class="card empty" style="grid-column:1/-1"><b>—</b>${t("aMenu")}</div>`}</div>
   </div>
   <div class="card cart"><div class="ph"><h3>${t("yourOrder")}</h3></div>
     ${cart.length?cart.map((c,i)=>{const m=mi(c.m);return `<div class="cline">
        <span class="q">${num(c.q)}×</span>
        <span style="flex:1">${esc(nm(m))}${c.s!=null?` <span style="color:var(--muted);font-size:11.5px">· ${esc(nm(SUG[c.s]))}</span>`:""}${c.milk?` <span style="color:var(--muted);font-size:11.5px">· ${t("withMilk")}</span>`:""}
          ${c.note?`<div style="font-size:11px;color:var(--coral-ink)">${esc(c.note)}</div>`:""}</span>
        <span class="mono" style="font-size:12px;color:var(--muted)">${m.free?t("free"):num(m.price*c.q)}</span>
        <button class="x" onclick="rmCart(${i})">×</button></div>`}).join("")
      :`<div class="empty"><b>${t("emptyCart")}</b>${t("emptyCartB")}</div>`}
     <div class="cfoot">${paying?payPanel(tot):`
       <div class="fld"><label>${t("where")}</label>
        <div class="wheretype">
          <button class="${whereType==="office"?"on":""}" onclick="setWhereType('office')">${t("whereOffice")}</button>
          <button class="${whereType==="room"?"on":""}" onclick="setWhereType('room')">${t("whereRoom")}</button>
        </div>
        ${whereType==="room"
          ?`<select class="inp" onchange="setWhereRoom(this.value)">
              <option value="">${t("wherePickRoom")}</option>
              ${ROOMS.map(r=>`<option value="${esc(r)}" ${whereRoom===r?"selected":""}>${esc(r)}</option>`).join("")}
            </select>`
          :`<input class="inp" placeholder="${t("wherePH")}" value="${esc(where)}" oninput="setWhere(this.value)">`}
       </div>
       <div class="ctot"><b>${t("yourOrder")}</b><span class="mono">${money(tot)}</span></div>
       <button class="btn" style="width:100%" ${cart.length?"":"disabled"} onclick="startPay()">${t("send")}</button>`}
     </div></div></div>`;
}
function vPickBranch(){
  return `<div class="eyebrow">${t("order")}</div>
  <div class="pickwrap"><h2>${t("whichBranch")}</h2><p>${t("whichBranchB")}</p>
    <div class="pickgrid">${SITES.map(s=>`
      <button class="pick ${s.live?"":"off"}" ${s.live?`onclick="setBranch('${s.id}')"`:"disabled"}>
        <span class="pdot"></span>
        <b>${esc(nm(s))}</b>
        <span class="psub">${s.live?num(M.filter(m=>inBranch(m,s.id)&&m.avail).length)+" "+t("itemsAvail"):t("soon")}</span>
      </button>`).join("")}</div></div>`;
}
function tog(id){openM=openM===id?null:id;if(openM&&!draft[id])draft[id]={q:1,s:2,milk:false,note:""};render()}
function setSug(id,s){draft[id].s=s;render()}
function setMilk(id,v){draft[id].milk=v;render()}
function stp(id,d){draft[id].q=Math.max(1,Math.min(30,draft[id].q+d));render()}
function setNote(id,v){draft[id].note=v}
function addCart(id){const m=mi(id),d=draft[id];
  cart.push({m:id,q:d.q,s:m.sugar?d.s:null,milk:m.milk?!!d.milk:null,note:(d.note||"").trim()});
  draft[id]={q:1,s:2,milk:false,note:""};openM=null;render()}
function rmCart(i){cart.splice(i,1);render()}
function startPay(){
  if(!cart.length)return;
  const tot=cart.reduce((a,c)=>a+effPrice(mi(c.m))*c.q,0);
  if(tot===0){ submitOrder(); return; }
  paying=true;render();
}
function payBack(){paying=false;render()}
function payPanel(tot){
  const qr = so(branch).qr || (branch==="kat" ? "/instapay-qr-kat.png" : branch==="moh" ? "/instapay-qr-moh.png" : "/instapay-qr.png");
  return `<div class="paypanel">
    <div class="payhead"><b>${t("payTitle")}</b><span class="mono">${money(tot)}</span></div>
    <img class="payqr" src="${qr}" alt="InstaPay QR — ${esc(nm(so(branch)))}">
    <p class="payhint">${t("payHint")}</p>
    <button class="btn" style="width:100%" onclick="submitOrder()">${t("payConfirm")}</button>
    <button class="btn ghost" style="width:100%;margin-top:8px" onclick="payBack()">${t("payBack")}</button>
  </div>`;
}
async function submitOrder(){
  try{
    const orderNo = await api.submitOrder({
      branchId: branch, requesterName: nm(myProfile),
      requesterNameAr: myProfile.ar, requesterNameEn: myProfile.en,
      location: (whereType==="room" ? whereRoom : where) || "—",
      lines: cart.map(c=>{ const m=mi(c.m); return {
        menuItemId: c.m, nameAr: m.ar, nameEn: m.en, qty: c.q, sugar: c.s, milk: c.milk, note: c.note, price: effPrice(m)
      };})
    });
    lastOrderNo = orderNo; cart=[]; paying=false; where=""; whereRoom=""; whereType="office"; view="confirmed"; render();
  }catch(e){ fail(e); }
}
function vConfirmed(){
  return `<div class="confirm"><div class="confirm-card">
    <div class="confirm-check">✓</div>
    <h2>${t("confirmTitle")}</h2>
    <p>${t("confirmBody")}</p>
    <div class="mono confirm-no">${esc(lastOrderNo)}</div>
    <button class="btn" style="width:100%;margin-top:16px" onclick="go('portal')">${t("confirmBack")}</button>
    <button class="btn ghost" style="width:100%;margin-top:8px" onclick="branch=null;go('order')">${t("confirmAnother")}</button>
  </div></div>`;
}

/* ═══════════════ الهيكل التنظيمي ═══════════════ */
let orgToggled=new Set();   // نودز اتلمست يدويًا (تعكس السلوك الافتراضي بتاعها)
let orgForceOpen=new Set(); // مسار البحث — لازم تفضل مفتوحة بغض النظر عن أي حاجة
let orgHighlight=null;

function orgIsOpen(id, depth){
  if(orgForceOpen.has(id)) return true;
  const defOpen = depth < 2; // الجذور ومستوى واحد تحتها مفتوحين افتراضيًا، الباقي مقفول
  return orgToggled.has(id) ? !defOpen : defOpen;
}
function toggleOrgNode(id){
  orgForceOpen.delete(id);
  orgToggled.has(id) ? orgToggled.delete(id) : orgToggled.add(id);
  render();
}
function orgRows(list, byManager, depth){
  return list.map(p=>{
    const kids = byManager[p.id]||[];
    const hasKids = kids.length>0;
    const open = hasKids && orgIsOpen(p.id, depth);
    return `<div class="org-row">
      <div class="org-line ${hasKids?"clickable":""} ${orgHighlight===p.id?"org-hl":""}" id="org-${esc(p.id)}"
          ${hasKids?`onclick="toggleOrgNode('${esc(p.id)}')"`:""}>
        <span class="org-chevron">${hasKids?(open?"▾":"▸"):""}</span>
        <span class="av">${esc((p.name||"?")[0]||"?")}</span>
        <span class="org-name"><b>${esc(p.name||"—")}</b>
          ${p.title?`<span>${esc(p.title)}</span>`:""}
          ${(p.email||p.phone||p.location)?`<span class="org-contact">${[
            p.location?`📍 ${esc(p.location)}`:"", p.email?`✉️ ${esc(p.email)}`:"", p.phone?`📱 ${esc(p.phone)}`:""
          ].filter(Boolean).join("  ·  ")}</span>`:""}</span>
        ${hasKids?`<span class="org-count">${kids.length}</span>`:""}
      </div>
      ${open?`<div class="org-children">${orgRows(kids,byManager,depth+1)}</div>`:""}
    </div>`;
  }).join("");
}
function orgBuild(){
  const titled = ORG.filter(p=>p.title&&p.title.trim());
  const byManagerAll={};
  titled.forEach(p=>{ if(p.managerId)(byManagerAll[p.managerId]=byManagerAll[p.managerId]||[]).push(p); });
  const hasReports=id=>!!(byManagerAll[id]&&byManagerAll[id].length);
  const kept = titled.filter(p=>p.managerId||hasReports(p.id));
  const keptIds = new Set(kept.map(p=>p.id));
  const byManager={};
  kept.forEach(p=>{ if(p.managerId)(byManager[p.managerId]=byManager[p.managerId]||[]).push(p); });
  const roots = kept.filter(p=>!keptIds.has(p.managerId));
  return {kept,byManager,roots};
}
function vOrg(){
  const {kept,byManager,roots} = orgBuild();
  return `<div class="eyebrow">${t("orgChart")}</div>
    <div class="org-tools">
      ${can("access")?`<button class="btn ghost sm" onclick="syncOrg()" id="orgSyncBtn">${t("orgSync")}</button>`:""}
      <input class="inp org-search" id="orgSearchInput" placeholder="${t("orgSearchPH")}"
        onkeydown="if(event.key==='Enter')orgSearch(this.value)">
      <button class="btn ghost sm" onclick="orgSearch(document.getElementById('orgSearchInput').value)">${t("orgSearchBtn")}</button>
    </div>
    ${kept.length
      ?`<div class="card org-wrap">${orgRows(roots,byManager,0)}</div>`
      :`<div class="card empty"><b>—</b>${t("orgEmpty")}</div>`}`;
}
function orgSearch(q){
  q=(q||"").trim().toLowerCase();
  if(!q) return;
  const match = ORG.find(p=>(p.name||"").toLowerCase().includes(q));
  if(!match){ orgHighlight=null; toast(t("orgNotFound")); render(); return; }
  const byId={}; ORG.forEach(p=>byId[p.id]=p);
  orgForceOpen=new Set();
  let cur=match;
  while(cur.managerId && byId[cur.managerId]){ orgForceOpen.add(cur.managerId); cur=byId[cur.managerId]; }
  orgHighlight=match.id;
  render();
  setTimeout(()=>{
    const el=document.getElementById("org-"+match.id);
    if(el) el.scrollIntoView({behavior:"smooth",block:"center",inline:"center"});
  },50);
}
async function syncOrg(){
  const btn=$("#orgSyncBtn"); if(btn){btn.disabled=true;btn.textContent=t("orgSyncing");}
  try{
    await api.syncOrgFromEntra();
    ORG = await api.listOrgPeople();
    toast(t("orgSynced")); render();
  }catch(e){ fail(e); render(); }
}

/* ═══════════════ معرض الصور ═══════════════ */
function vGallery(){
  return `<div class="eyebrow">${t("gallery")}</div>
    ${can("gallery")?`<div class="gal-upload">
      <label class="btn ghost sm gal-picklabel">${t("uploadPhoto")}
        <input type="file" accept="image/*" id="galFile" style="display:none" onchange="uploadGalleryPhoto(this)"></label>
      <input class="inp" id="galCaption" placeholder="${t("captionPH")}" style="max-width:260px">
    </div>`:""}
    ${GALLERY.length?`<div class="gal-grid">${GALLERY.map(g=>`<div class="gal-item">
        <img src="${esc(g.url)}" loading="lazy">
        ${g.caption?`<div class="gal-cap">${esc(g.caption)}</div>`:""}
        ${can("gallery")?`<button class="gal-del" onclick="delGalleryPhoto('${esc(g.id)}')" title="${t("imageRemove")}">🗑</button>`:""}
      </div>`).join("")}</div>`
      :`<div class="card empty"><b>—</b>${t("galleryEmpty")}</div>`}`;
}
async function uploadGalleryPhoto(input){
  const file = input.files && input.files[0];
  if(!file) return;
  const caption = $("#galCaption")?.value.trim() || "";
  toast(t("imageUploading"));
  try{
    const url = await api.uploadImage(file);
    const row = await api.addGalleryPhoto(url, caption);
    GALLERY.unshift(row);
    toast(t("galleryAdded")); render();
  }catch(e){ fail(e); }
  finally{ input.value=""; }
}
async function delGalleryPhoto(id){
  if(!confirm(t("galleryConfirmDel"))) return;
  try{
    await api.removeGalleryPhoto(id);
    GALLERY = GALLERY.filter(g=>g.id!==id);
    toast(t("galleryDeleted")); render();
  }catch(e){ fail(e); }
}

/* ═══════════════ طلباتي ═══════════════ */
const STATUS_LBL={new:"statusNew",preparing:"statusPreparing",delivered:"statusDelivered",rejected:"statusRejected"};
const STATUS_CLS={new:"",preparing:"p",delivered:"d",rejected:"r"};
function vMyOrders(){
  if(MY_ORDERS===null) return `<div class="eyebrow">${t("myOrders")}</div><div class="card empty"><b>—</b>${t("loading")}</div>`;
  return `<div class="eyebrow">${t("myOrders")}</div>
    ${MY_ORDERS.length?`<div class="card">${MY_ORDERS.map(o=>`<div class="item" style="flex-wrap:wrap">
        <div class="body"><b class="mono">${esc(o.no)}</b>
          <p>${new Date(o.at).toLocaleString(lang==="ar"?"ar-EG":"en-US",{dateStyle:"medium",timeStyle:"short"})} · ${money(o.total)}</p>
          ${o.status==="rejected"&&o.reason?`<p style="color:var(--coral-ink)">${t("rejectedBecause")}: ${esc(o.reason)}</p>`:""}
        </div>
        <span class="pill ${STATUS_CLS[o.status]?"p":""}" style="${o.status==='rejected'?'background:var(--coral-soft);color:var(--coral-ink)':''}">${t(STATUS_LBL[o.status]||o.status)}</span>
      </div>`).join("")}</div>`
     :`<div class="card empty"><b>—</b>${t("noOrdersYet")}</div>`}`;
}

/* ═══════════════ admin ═══════════════ */
function vAdmin(){
  const cur=TABS.find(x=>x[0]===tab)||TABS[0],ok=!cur[3]||can(cur[3]);
  return `<div class="eyebrow">${t("admin")} · ${esc(nm(myProfile))} — ${esc(nm(role()))}</div>
  <div class="adm"><div class="admnav">${TABS.map(([k,l,ic,p])=>{
      const allow=!p||can(p);
      return `<button class="${tab===k?"on":""} ${allow?"":"locked"}" ${allow?`onclick="setTab('${k}')"`:"disabled"}>
        <span class="ic">${ic}</span>${t(l)}${allow?"":" 🔒"}</button>`}).join("")}</div>
    <div>${!ok?`<div class="card empty"><b>🔒 ${t("noPerm")}</b>${esc(nm(role()))}</div>`
      :tab==="overview"?aOver():tab==="access"?aAccess():aList(tab)}</div></div>`;
}
function setTab(k){tab=k;edit=null;render()}
let branchEdit=null;
function branchForm(){
  const d=branchEdit;
  return `<div class="form"><div class="fgrid">
    <div class="fld"><label>${t("branchId")} <span class="mono" style="opacity:.45">id</span></label>
      <input class="inp" ${d.isNew?"":"disabled"} value="${esc(d.id)}" placeholder="${t("branchIdHint")}"
        oninput="setBranchField('id',this.value)"></div>
    <div class="fld"><label>${t("titleAR")}</label>
      <input class="inp" value="${esc(d.ar)}" oninput="setBranchField('ar',this.value)"></div>
    <div class="fld"><label>${t("titleEN")}</label>
      <input class="inp" value="${esc(d.en)}" oninput="setBranchField('en',this.value)"></div>
    <div class="fld"><label>${t("branchLive")}</label>
      <select class="inp" onchange="setBranchLive(this.value)">
        <option value="1" ${d.live?"selected":""}>${t("branchLiveYes")}</option>
        <option value="0" ${d.live?"":"selected"}>${t("branchLiveNo")}</option>
      </select></div>
    <div class="fld full"><label>${t("branchQr")}</label>
      <div class="img-edit">
        ${d.qr?`<img src="${esc(d.qr)}" class="img-edit-preview">
          <button class="iact del" type="button" onclick="setBranchField('qr','')">🗑</button>`
        :`<label class="btn ghost sm gal-picklabel">${t("uploadPhoto")}
            <input type="file" accept="image/*" style="display:none" onchange="uploadBranchQr(this)"></label>`}
      </div>
    </div>
  </div>
  <div class="formacts"><button class="btn sm" onclick="saveBranch()">${t("save")}</button>
    <button class="btn ghost sm" onclick="cancelBranchEdit()">${t("cancel")}</button></div></div>`;
}
function startBranchNew(){ branchEdit={id:"",ar:"",en:"",live:true,qr:"",isNew:true}; render(); }
function startBranchEdit(id){
  const s=SITES.find(x=>x.id===id); if(!s) return;
  branchEdit={id:s.id,ar:s.ar,en:s.en,live:s.live,qr:s.qr||"",isNew:false}; render();
}
function cancelBranchEdit(){ branchEdit=null; render(); }
async function uploadBranchQr(input){
  const file = input.files && input.files[0];
  if(!file || !branchEdit) return;
  toast(t("imageUploading"));
  try{
    const url = await api.uploadImage(file);
    branchEdit.qr = url;
    toast(t("imageUploaded")); render();
  }catch(e){ fail(e); }
}
function setBranchField(k,v){ if(branchEdit) branchEdit[k]=v; }
function setBranchLive(v){ if(branchEdit) branchEdit.live=(v==="1"); }
async function saveBranch(){
  if(!branchEdit) return;
  const d=branchEdit;
  if(d.isNew && !/^[a-z0-9-]{2,20}$/.test(d.id.trim())){ toast(t("branchIdInvalid")); return; }
  if(!d.ar.trim()||!d.en.trim()){ toast(t("branchNamesRequired")); return; }
  try{
    const saved=await api.upsertBranch({...d,id:d.id.trim()});
    const i=SITES.findIndex(x=>x.id===saved.id);
    i>-1?SITES[i]=saved:SITES.push(saved);
    branchEdit=null; toast(t("saved")); render();
  }catch(e){ fail(e); }
}
async function deleteBranch(id){
  if(!confirm(t("branchDeleteConfirm"))) return;
  try{
    await api.removeBranch(id);
    SITES=SITES.filter(x=>x.id!==id);
    toast(t("deleted")); render();
  }catch(e){ fail(e); }
}
function aOver(){
  const live=O.filter(o=>o.st!=="done").length;
  const today=O.filter(o=>Date.now()-o.at<864e5).length;
  return `<div class="sec"><div class="sechd"><div><h3>${t("overview")}</h3>
    <p>${t("canEdit")}: ${role().perms.map(secLbl).join(" · ")||"—"}</p></div></div>
    <div class="stat4">
      <div class="sbox"><b style="color:var(--coral-2)">${num(live)}</b><span>${t("openOrders")}</span></div>
      <div class="sbox"><b style="color:var(--peri-ink)">${num(today)}</b><span>${t("todayOrders")}</span></div>
      <div class="sbox"><b>${num(C.news.length)}</b><span>${t("newsCount")}</span></div>
      <div class="sbox"><b>${num(C.policies.length)}</b><span>${t("policyCount")}</span></div></div></div>
  <div class="sec"><div class="sechd"><div><h3>${t("branches")}</h3><p>${t("branchNote")}</p></div>
      ${can("access")?`<button class="btn sm" onclick="startBranchNew()">+ ${t("addBranch")}</button>`:""}</div>
    ${(can("access")&&branchEdit&&branchEdit.isNew)?branchForm():""}
    ${SITES.map(s=>{
      if(can("access")&&branchEdit&&!branchEdit.isNew&&branchEdit.id===s.id) return branchForm();
      const op=O.filter(o=>o.site===s.id&&o.st!=="done").length;
      return `<div class="item"><div class="body"><b>${esc(nm(s))}</b>
        <p>${s.live?num(M.filter(m=>inBranch(m,s.id)&&m.avail).length)+" "+t("itemsAvail")+" · "+num(op)+" "+t("openOrders"):t("soon")}</p></div>
        <span class="pill ${s.live?"p":""}">${s.live?"live":t("soon")}</span>
        ${can("access")?`<div class="acts">
          <button class="iact" onclick="startBranchEdit('${esc(s.id)}')">✎</button>
          <button class="iact del" onclick="deleteBranch('${esc(s.id)}')">🗑</button></div>`:""}</div>`;
    }).join("")}</div>
  ${can("access")?`<div class="sec"><div class="sechd"><div><h3>${t("kioskTitle")}</h3><p>${t("kioskNote")}</p></div></div>
    ${LIVE().map(s=>`<div class="item" style="flex-wrap:wrap;align-items:flex-start">
        <div class="body" style="flex-basis:100%">
          <b>${esc(nm(s))}</b>
          <p class="mono" style="word-break:break-all">${esc(location.origin)}/kitchen.html?branch=${esc(s.id)}</p>
        </div>
        <input class="inp" id="kiosk-pw-${esc(s.id)}" placeholder="${t("kioskNewPw")}" style="max-width:200px">
        <button class="btn sm" onclick="saveKioskPw('${esc(s.id)}')">${t("save")}</button>
      </div>`).join("")}</div>`:""}`;
}
function lbl(k,x){
  if(k==="news")return[lang==="ar"?x.titleAR:x.titleEN,(lang==="ar"?x.tagAR:x.tagEN)+" · "+x.date];
  if(k==="links")return[nm(x),x.icon+"  "+x.url];
  if(k==="policies")return[nm(x),x.dept+" · v"+x.ver+" · "+x.date];
  if(k==="events")return[nm(x),(lang==="ar"?x.placeAR:x.placeEN)+" · "+x.day];
  if(k==="menu")return[nm(x),catLabel(x.cat)+" · "+money(x.price)+(x.avail?"":" · ✕")];
  return[nm(x),""];
}
function aList(k){
  const arr=k==="menu"?M:C[k];
  return `<div class="sec"><div class="sechd"><div><h3>${secLbl(k)}</h3><p>${num(arr.length)}</p></div>
      <button class="btn sm" onclick="startEdit('${k}',null)">+ ${t("add")}</button></div>
    ${edit&&eKind===k?form(k):""}
    ${arr.length?arr.map(x=>{const[a,b]=lbl(k,x);return `<div class="item">
        ${k==="menu"?swatchHtml(x,30):""}
        ${(k==="news"||k==="events")&&x.image?`<img src="${esc(x.image)}" style="width:30px;height:30px;border-radius:7px;object-fit:cover;flex-shrink:0">`:""}
        <div class="body"><b>${esc(a)}</b><p>${esc(b)}</p></div>
        ${k==="menu"?`<span class="pill ${x.site==="all"?"":"o"}">${x.site==="all"?t("allBranches"):esc(nm(so(x.site)))}</span>`:""}
        <div class="acts">${k==="menu"?`<button class="iact" title="${t("avail")}" onclick="togAvail('${x.id}')">${x.avail?"◉":"○"}</button>`:""}
          <button class="iact" onclick="startEdit('${k}','${x.id}')">✎</button>
          <button class="iact del" onclick="delItem('${k}','${x.id}')">🗑</button></div></div>`}).join("")
     :`<div class="empty"><b>—</b>${t("add")}</div>`}</div>`;
}
function form(k){
  const d=edit;
  return `<div class="form"><div class="fgrid">
    ${FIELDS[k].map(([key,lab,multi])=>`<div class="fld ${multi||key==="image"||key==="icon"?"full":""}">
      <label>${t(lab)} <span class="mono" style="opacity:.45">${key}</span></label>
      ${multi?`<textarea class="inp" oninput="setEditField('${key}',this.value)">${esc(d[key]||"")}</textarea>`
      :key==="image"?`<div class="img-edit">
          ${d.image?`<img src="${esc(d.image)}" class="img-edit-preview">
            <button class="iact del" type="button" onclick="removeEditImage()">🗑</button>`
          :`<label class="btn ghost sm gal-picklabel">${t("uploadPhoto")}
              <input type="file" accept="image/*" style="display:none" onchange="uploadEditImage(this)"></label>`}
        </div>`
      :key==="icon"?`<div class="icon-edit">
          <div class="icon-presets">${ICON_PRESETS.map(ic=>`<button type="button" class="icon-pick ${d.icon===ic?"on":""}"
            onclick="setEditIcon('${ic}')">${ic}</button>`).join("")}</div>
          <div class="icon-custom">
            ${isUrl(d.icon)?`<img src="${esc(d.icon)}" class="img-edit-preview">
              <button class="iact del" type="button" onclick="setEditIcon('')">🗑</button>`
            :`<label class="btn ghost sm gal-picklabel">${t("uploadIcon")}
                <input type="file" accept="image/*" style="display:none" onchange="uploadEditIcon(this)"></label>`}
          </div>
        </div>`
      :key==="startsAt"?`<input type="datetime-local" class="inp" value="${esc(d.startsAt?toLocalInput(d.startsAt):"")}"
          oninput="setEditField('startsAt',this.value?new Date(this.value).toISOString():null)">`
      :`<input class="inp" value="${esc(d[key]??"")}" oninput="setEditField('${key}',this.value)">`}</div>`).join("")}
    ${k==="menu"?`<div class="fld"><label>${t("branch")}</label><select class="inp" onchange="setEditSite(this.value)">
        <option value="all" ${d.site==="all"?"selected":""}>${t("allBranches")}</option>
        ${LIVE().map(s=>`<option value="${s.id}" ${d.site===s.id?"selected":""}>${esc(nm(s))}</option>`).join("")}</select></div>
      <div class="fld"><label>${t("cat")}</label><select class="inp" onchange="setEditCat(this.value)">
        ${CATS.filter(c=>c.k!=="all").map(c=>`<option value="${c.k}" ${d.cat===c.k?"selected":""}>${esc(nm(c))}</option>`).join("")}</select></div>
      <div class="fld"><label>${t("hasSugar")}</label><select class="inp" onchange="setEditSugar(this.value)">
        <option value="1" ${d.sugar?"selected":""}>✓</option><option value="0" ${d.sugar?"":"selected"}>✕</option></select></div>
      <div class="fld"><label>${t("hasMilk")}</label><select class="inp" onchange="setEditMilk(this.value)">
        <option value="1" ${d.milk?"selected":""}>✓</option><option value="0" ${d.milk?"":"selected"}>✕</option></select></div>
      <div class="fld"><label>${t("isFree")}</label><select class="inp" onchange="setEditFree(this.value)">
        <option value="1" ${d.free?"selected":""}>✓</option><option value="0" ${d.free?"":"selected"}>✕</option></select></div>`:""}
    </div>
    <div class="formacts"><button class="btn sm" onclick="saveItem('${k}')">${t("save")}</button>
      <button class="btn ghost sm" onclick="cancelEdit()">${t("cancel")}</button></div></div>`;
}
function startEdit(k,id){
  const arr=k==="menu"?M:C[k];
  edit = id ? structuredClone(arr.find(x=>x.id===id))
    : (k==="menu" ? {site:"all",cat:"snacks",price:10,sugar:false,milk:false,free:false,avail:true,col:"#B5651D"} : {});
  eKind=k; render();
}
function cancelEdit(){edit=null;render()}
function setEditField(key,v){edit[key]=v}
function setEditSite(v){edit.site=v}
function setEditCat(v){edit.cat=v}
function setEditSugar(v){edit.sugar=(v==="1")}
function setEditMilk(v){edit.milk=(v==="1")}
function setEditFree(v){edit.free=(v==="1")}
async function uploadEditImage(input){
  const file = input.files && input.files[0];
  if(!file || !edit) return;
  toast(t("imageUploading"));
  try{
    const url = await api.uploadImage(file);
    edit.image = url;
    toast(t("imageUploaded")); render();
  }catch(e){ fail(e); }
}
function removeEditImage(){ if(edit){ edit.image=null; render(); } }
function setEditIcon(v){ if(edit){ edit.icon=v; render(); } }
async function uploadEditIcon(input){
  const file = input.files && input.files[0];
  if(!file || !edit) return;
  toast(t("imageUploading"));
  try{
    const url = await api.uploadImage(file);
    edit.icon = url;
    toast(t("imageUploaded")); render();
  }catch(e){ fail(e); }
}
async function saveItem(k){
  if(k==="menu")edit.price=Number(edit.price)||0;
  try{
    const saved=await api.upsert(k,edit);
    const arr=k==="menu"?M:C[k], i=arr.findIndex(x=>x.id===saved.id);
    i>-1?arr[i]=saved:arr.unshift(saved);
    edit=null;toast(t("saved"));render();
  }catch(e){ fail(e); }
}
async function delItem(k,id){
  try{
    await api.remove(k,id);
    const arr=k==="menu"?M:C[k]; arr.splice(arr.findIndex(x=>x.id===id),1);
    toast(t("deleted"));render();
  }catch(e){ fail(e); }
}
async function togAvail(id){
  const m=M.find(x=>x.id===id);
  try{ const saved=await api.upsert("menu",{...m,avail:!m.avail}); Object.assign(m,saved); render(); }
  catch(e){ fail(e); }
}
function aAccess(){
  return `<div class="sec"><div class="sechd"><div><h3>${t("aAccess")}</h3><p>${t("role")} × ${t("canEdit")}</p></div></div>
    <div class="note">${t("permNote")}</div>
    <div class="mscroll"><table class="matrix"><thead><tr><th>${t("role")}</th>
      ${SECTIONS.map(s=>`<th>${secLbl(s)}</th>`).join("")}</tr></thead><tbody>
      ${A.roles.map(r=>`<tr><td>${esc(nm(r))}</td>${SECTIONS.map(s=>{
        const on=r.perms.includes(s),ro=r.id==="admin";
        return `<td><button class="chk ${on?"on":""} ${ro?"ro":""}" ${ro?"disabled":`onclick="togPerm('${r.id}','${s}')"`}>✓</button></td>`}).join("")}</tr>`).join("")}
      </tbody></table></div></div>
  <div class="sec"><div class="sechd"><div><h3>${t("people")}</h3><p>${num(A.users.length)}</p></div>
      <button class="btn ghost sm" onclick="autoTranslateAll()">${t("autoTranslateAll")}</button></div>
    ${A.users.map(u=>{const cls=u.role==="admin"?"c":u.role==="hr"?"o":"";
      return `<div class="item"><span class="av ${cls}">${esc((nm(u)||"?")[0])}</span>
        <div class="body"><b>${esc(nm(u))}</b><p>${u.site?esc(nm(so(u.site))):"—"}</p></div>
        <input class="inp" style="width:130px" placeholder="${t("nameArHint")}" value="${esc(u.ar!==u.en?u.ar:'')}"
          onblur="saveNameAr('${u.id}',this.value)">
        <select class="inp" style="width:auto" onchange="setBranchAdm('${u.id}',this.value)">
          <option value="">—</option>
          ${SITES.map(s=>`<option value="${s.id}" ${u.site===s.id?"selected":""}>${esc(nm(s))}</option>`).join("")}</select>
        <select class="inp" style="width:auto" onchange="setRole('${u.id}',this.value)">
          ${A.roles.map(x=>`<option value="${x.id}" ${x.id===u.role?"selected":""}>${esc(nm(x))}</option>`).join("")}</select></div>`}).join("")}</div>`;
}
async function saveNameAr(id,v){
  v=v.trim();
  try{
    await api.setFullNameAr(id, v||null);
    const u=A.users.find(x=>x.id===id);
    if(u) u.ar = v || u.en;
    if(id===myProfile.id) myProfile.ar = v || myProfile.en;
    toast(t("saved"));
  }catch(e){ fail(e); }
}
async function autoTranslateAll(){
  const todo=A.users.filter(u=>u.ar===u.en);
  if(!todo.length){ toast(t("autoTranslateNone")); return; }
  try{
    await Promise.all(todo.map(async u=>{
      const guess=transliterateToArabic(u.en);
      if(!guess) return;
      await api.setFullNameAr(u.id, guess);
      u.ar=guess;
      if(u.id===myProfile.id) myProfile.ar=guess;
    }));
    toast(t("autoTranslateDone")); render();
  }catch(e){ fail(e); }
}
async function togPerm(rid,s){
  const r=A.roles.find(x=>x.id===rid), on=!r.perms.includes(s);
  try{
    await api.setRolePermission(rid,s,on);
    on?r.perms.push(s):r.perms.splice(r.perms.indexOf(s),1);
    if(myProfile.role===rid){
      if(!role().perms.length&&view==="admin")view="portal";
      if(tab!=="overview"&&!can(TABS.find(x=>x[0]===tab)?.[3]||""))tab="overview";
    }
    render();
  }catch(e){ fail(e); }
}
async function setRole(id,rid){
  try{
    await api.setUserRole(id,rid);
    const u=A.users.find(x=>x.id===id); if(u)u.role=rid;
    if(id===myProfile.id){
      myProfile.role=rid;
      if(!role().perms.length&&view==="admin")view="portal";
      if(tab!=="overview"&&!can(TABS.find(x=>x[0]===tab)?.[3]||""))tab="overview";
    }
    toast(t("saved"));render();
  }catch(e){ fail(e); }
}
async function setBranchAdm(id,bid){
  try{
    await api.setUserBranch(id, bid||null);
    const u=A.users.find(x=>x.id===id); if(u)u.site=bid||null;
    if(id===myProfile.id)myProfile.site=bid||null;
    toast(t("saved"));render();
  }catch(e){ fail(e); }
}
async function saveKioskPw(branchId){
  const el=$("#kiosk-pw-"+branchId), v=el?el.value.trim():"";
  if(v.length<4){ toast(t("pwTooShort")); return; }
  try{ await api.setScreenPassword(branchId, v); toast(t("pwSaved")); if(el)el.value=""; }
  catch(e){ fail(e); }
}

/* ═══════════════ expose handlers used by inline HTML onclick/onchange ═══════════════ */
Object.assign(window, {
  doSignIn, doSignOut, go, setLang, setBranch, changeBranch, setCat, setWhere, setWhereType, setWhereRoom,
  tog, setSug, setMilk, stp, setNote, addCart, rmCart, startPay, payBack, submitOrder,
  setTab, startEdit, cancelEdit, setEditField, setEditSite, setEditCat, setEditSugar, setEditMilk,
  saveItem, delItem, togAvail, togPerm, setRole, setBranchAdm, syncOrg, saveKioskPw,
  toggleOrgNode, orgSearch, uploadGalleryPhoto, delGalleryPhoto, uploadEditImage, removeEditImage,
  setEditIcon, uploadEditIcon, startBranchNew, startBranchEdit, cancelBranchEdit,
  setBranchField, setBranchLive, saveBranch, deleteBranch, uploadBranchQr, saveNameAr, setEditFree, autoTranslateAll,
  startAboutEdit, cancelAboutEdit, saveAbout,
});
