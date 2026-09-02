/**
 * kitchen.js — شاشة البوفيه، بدون تسجيل دخول
 *
 * الفرع بيتحدد من التوكن في الـ URL (?token=...) مش من اختيار المستخدم —
 * كل جهاز/شاشة مربوط بفرع واحد ثابت. القراءة والكتابة بتمر على دالتين بس
 * (kitchen_board / kitchen_set_status) عن طريق src/api.js، ومفيش وصول مباشر
 * لأي جدول من الصفحة دي.
 */
import { displayToken, kitchenBoard, kitchenSetStatus, watchOrders } from './api.js';

const L = { ar: {
 title:"شاشة البوفيه", noLogin:"بدون تسجيل دخول",
 kNew:"جديد", kProg:"بيتحضّر",
 kStart:"ابدأ التحضير", kDelivered:"اتسلّم ✓", kReject:"رفض",
 kEmpty:"مفيش طلبات مفتوحة", kEmptyB:"الطلبات الجديدة هتظهر هنا لوحدها",
 badToken:"اللينك ده مش صحيح", badTokenB:"كلّم الأدمن يديك لينك الشاشة الصح لفرعك.",
},en:{
 title:"Buffet screen", noLogin:"No sign-in needed",
 kNew:"NEW", kProg:"PREPARING",
 kStart:"Start preparing", kDelivered:"Delivered ✓", kReject:"Reject",
 kEmpty:"No open orders", kEmptyB:"New orders appear here on their own",
 badToken:"This link isn't valid", badTokenB:"Ask an admin for your branch's screen link.",
}};

let lang="en", rows=[], failed=false;
const t=k=>L[lang][k]??k;
const num=n=>Number(n).toLocaleString(lang==="ar"?"ar-EG":"en-US");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=s=>document.querySelector(s);
const dots=n=>`<span class="dots">${[0,1,2].map(i=>`<i class="${i<n?"on":""}"></i>`).join("")}</span>`;
const SUG=[{ar:"سادة",en:"None"},{ar:"خفيف",en:"Light"},{ar:"مظبوط",en:"Medium"},{ar:"زيادة",en:"Extra"}];
const nm=o=>o?(o[lang]??o.ar??o.en??""):"";

async function refresh(){
  try{ rows = await kitchenBoard(); failed=false; }
  catch(e){ console.error(e); failed=true; }
  render();
}
function setLang(l){lang=l;render()}
async function setSt(orderNo, status){
  try{ await kitchenSetStatus(orderNo, status); await refresh(); }
  catch(e){ console.error(e); }
}
window.setLang = setLang;
window.setSt = setSt;

function render(){
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";

  if(!displayToken()){
    $("#app").innerHTML = `<div class="signin"><div class="signin-card">
      <h1>${t("badToken")}</h1><p>${t("badTokenB")}</p></div></div>`;
    return;
  }
  if(failed){
    $("#app").innerHTML = `<div class="signin"><div class="signin-card">
      <h1>${t("badToken")}</h1><p>${t("badTokenB")}</p></div></div>`;
    return;
  }

  const d=new Date(), clk=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
  const newCount = rows.filter(r=>r.status==="new").length;
  const progCount = rows.filter(r=>r.status==="preparing").length;

  $("#app").innerHTML = `<div class="kwrap"><div class="khead">
     <div><h2>${t("title")}</h2>
       <div class="sub">AUTO-REFRESH · 30s <span class="nologin">${t("noLogin")}</span>
       <span class="langsw" style="margin-inline-start:8px">
         <button class="${lang==="ar"?"on":""}" onclick="setLang('ar')">ع</button>
         <button class="${lang==="en"?"on":""}" onclick="setLang('en')">EN</button></span></div></div>
     <div class="kstats">
       <div class="kstat n"><b>${num(newCount)}</b><span>${t("kNew")}</span></div>
       <div class="kstat p"><b>${num(progCount)}</b><span>${t("kProg")}</span></div>
       <div class="kclock">${clk}</div></div></div>
   <div class="kboard">${rows.length?rows.map(o=>{
     const mins=Math.floor((Date.now()-new Date(o.created_at).getTime())/6e4), late=mins>=10;
     return `<div class="ticket ${o.status==="preparing"?"prog":""} ${late?"late":""}">
       <div class="thd"><div class="t1"><span class="tno">${esc(o.order_no)}</span>
         <span class="timer">${String(mins).padStart(2,"0")}:00${late?" ⚠":""}</span></div>
         <h4>${esc(o.requester_first)}</h4><div class="where">${esc(o.location||"")}</div></div>
       ${(o.items||[]).map(l=>`<div class="tl"><span class="qn">${num(l.qty)}×</span>
         <span><b>${esc(lang==="ar"?l.name_ar:l.name_en)}</b>
         ${l.sugar!=null?`<span class="sug">${dots(l.sugar)}<em>${esc(nm(SUG[l.sugar]))}</em></span>`:""}
         ${l.note?`<div class="note">✎ ${esc(l.note)}</div>`:""}</span></div>`).join("")}
       <div class="tft">${o.status==="new"
         ?`<button class="b-s" onclick="setSt('${o.order_no}','preparing')">${t("kStart")}</button>
           <button class="b-r" onclick="setSt('${o.order_no}','rejected')">${t("kReject")}</button>`
         :`<button class="b-d" onclick="setSt('${o.order_no}','delivered')">${t("kDelivered")}</button>`}</div></div>`}).join("")
    :`<div class="kempty"><b>${t("kEmpty")}</b>${t("kEmptyB")}</div>`}</div></div>`;
}

refresh();
setInterval(refresh, 30000);
watchOrders(()=>refresh());
