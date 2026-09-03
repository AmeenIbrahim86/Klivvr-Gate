/**
 * kitchen.js — شاشة البوفيه، بدون تسجيل دخول بحساب Microsoft
 *
 * الفرع بيتحدد من الـ URL (?branch=kat) — اللينك نفسه عادي ومش سري.
 * الحماية الحقيقية باسورد بيتكتب على الشاشة نفسها، والأدمن يقدر يغيّره
 * في أي وقت من لوحة الإدارة (Overview) من غير ما يلمس الكود أو الـ SQL.
 * الباسورد بيتفضّل في الجهاز نفسه (sessionStorage) عشان الشاشة متطلبش
 * الباسورد تاني كل ما الصفحة تتحدّث لوحدها.
 */
import { branchFromUrl, kitchenLogin, kitchenBoard, kitchenSetStatus, watchOrders } from './api.js';

const L = { ar: {
 title:"شاشة البوفيه", noLogin:"بدون تسجيل دخول",
 kNew:"جديد", kProg:"بيتحضّر",
 kStart:"ابدأ التحضير", kDelivered:"اتسلّم ✓", kReject:"رفض",
 kEmpty:"مفيش طلبات مفتوحة", kEmptyB:"الطلبات الجديدة هتظهر هنا لوحدها", withMilk:"بلبن", cashDue:"كاش لسه",
 noBranch:"اللينك ده ناقصه الفرع", noBranchB:"كلّم الأدمن يديك لينك الشاشة الصح لفرعك.",
 enterPw:"باسورد الشاشة", enterPwB:"اكتب باسورد شاشة الفرع ده.",
 pwPH:"الباسورد", unlock:"دخول", wrongPw:"الباسورد غلط، جرّب تاني.",
 reasonUnavailable:"غير متوفر", reasonOutOfStock:"خلص من المخزون", reasonOtherPH:"سبب تاني...",
 confirmReject:"تأكيد الرفض", cancel:"إلغاء",
},en:{
 title:"Buffet screen", noLogin:"No sign-in needed",
 kNew:"NEW", kProg:"PREPARING",
 kStart:"Start preparing", kDelivered:"Delivered ✓", kReject:"Reject",
 kEmpty:"No open orders", kEmptyB:"New orders appear here on their own", withMilk:"With milk", cashDue:"Cash due",
 noBranch:"This link is missing a branch", noBranchB:"Ask an admin for your branch's screen link.",
 enterPw:"Screen password", enterPwB:"Enter this branch's screen password.",
 pwPH:"Password", unlock:"Unlock", wrongPw:"Wrong password, try again.",
 reasonUnavailable:"Not available", reasonOutOfStock:"Out of stock", reasonOtherPH:"Other reason...",
 confirmReject:"Confirm rejection", cancel:"Cancel",
}};

const branch = branchFromUrl();
const pwKey = "kitchen_pw_" + (branch || "x");
let lang="en", rows=[], unlocked=false, password="", loginErr="", checking=false;
let rejectingOrder=null, rejectCustom="";
const t=k=>L[lang][k]??k;
const num=n=>Number(n).toLocaleString(lang==="ar"?"ar-EG":"en-US");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=s=>document.querySelector(s);
const dots=n=>`<span class="dots">${[0,1,2].map(i=>`<i class="${i<n?"on":""}"></i>`).join("")}</span>`;
const SUG=[{ar:"سادة",en:"None"},{ar:"خفيف",en:"Light"},{ar:"مظبوط",en:"Medium"},{ar:"زيادة",en:"Extra"}];
const nm=o=>o?(o[lang]??o.ar??o.en??""):"";

function setLang(l){lang=l;render()}
window.setLang = setLang;

async function tryPassword(pw){
  checking=true; loginErr=""; render();
  try{
    const ok = await kitchenLogin(branch, pw);
    if(ok){
      password = pw; unlocked = true;
      try{ sessionStorage.setItem(pwKey, pw); }catch(e){}
      await refresh();
      setInterval(refresh, 30000);
      watchOrders(branch, ()=>refresh());
    }else{
      loginErr = t("wrongPw");
      try{ sessionStorage.removeItem(pwKey); }catch(e){}
    }
  }catch(e){ console.error(e); loginErr = t("wrongPw"); }
  checking=false; render();
}
function submitPassword(){
  const v = $("#kpw")?.value || "";
  if(v) tryPassword(v);
}
window.submitPassword = submitPassword;

async function refresh(){
  if(!unlocked) return;
  try{ rows = await kitchenBoard(branch, password); }
  catch(e){
    console.error(e);
    // الباسورد اتغيّر أو بقى غلط — ارجع لشاشة الدخول تاني
    unlocked = false; loginErr = t("wrongPw");
    try{ sessionStorage.removeItem(pwKey); }catch(err){}
  }
  render();
}
async function setSt(orderNo, status, reason){
  try{ await kitchenSetStatus(branch, password, orderNo, status, reason); await refresh(); }
  catch(e){ console.error(e); }
}
window.setSt = setSt;

function startReject(orderNo){ rejectingOrder=orderNo; rejectCustom=""; render(); }
function cancelReject(){ rejectingOrder=null; rejectCustom=""; render(); }
function pickRejectReason(orderNo, reason){ setSt(orderNo,"rejected",reason); rejectingOrder=null; }
function setRejectCustom(v){ rejectCustom=v; }
function confirmRejectCustom(orderNo){
  const v=(rejectCustom||"").trim();
  if(!v) return;
  setSt(orderNo,"rejected",v); rejectingOrder=null;
}
window.startReject=startReject; window.cancelReject=cancelReject;
window.pickRejectReason=pickRejectReason; window.setRejectCustom=setRejectCustom;
window.confirmRejectCustom=confirmRejectCustom;

function render(){
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";

  if(!branch){
    $("#app").innerHTML = `<div class="signin"><div class="signin-card">
      <h1>${t("noBranch")}</h1><p>${t("noBranchB")}</p></div></div>`;
    return;
  }
  if(!unlocked){
    $("#app").innerHTML = `<div class="signin"><div class="signin-card">
      <h1>${t("enterPw")}</h1><p>${t("enterPwB")}</p>
      <div class="mono" style="font-size:11px;color:var(--muted);margin-top:6px">${esc(branch)}</div>
      <input id="kpw" class="inp" type="password" placeholder="${t("pwPH")}" style="margin-top:16px;text-align:center"
        onkeydown="if(event.key==='Enter')submitPassword()">
      ${loginErr?`<p style="color:var(--coral-ink);font-size:12.5px;margin-top:8px">${esc(loginErr)}</p>`:""}
      <button class="btn" style="width:100%;margin-top:14px" ${checking?"disabled":""} onclick="submitPassword()">
        ${checking?"…":t("unlock")}</button>
      <span class="signin-lang">
        <button class="${lang==="ar"?"on":""}" onclick="setLang('ar')">ع</button>
        <button class="${lang==="en"?"on":""}" onclick="setLang('en')">EN</button></span>
    </div></div>`;
    // جرّب الباسورد المحفوظ من قبل تلقائيًا (بدون ما نعرضه)
    const saved = (()=>{ try{ return sessionStorage.getItem(pwKey); }catch(e){ return null; } })();
    if(saved && !checking && !loginErr) tryPassword(saved);
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
         <h4>${esc((lang==="ar"?o.requester_first_ar:o.requester_first_en)||o.requester_first_en||o.requester_first_ar||"")}</h4>
         <div class="where">${esc(o.location||"")}${o.payment_method==="cash"?` <span class="cash-badge">💵 ${t("cashDue")}</span>`:""}</div></div>
       ${(o.items||[]).map(l=>`<div class="tl"><span class="qn">${num(l.qty)}×</span>
         <span><b>${esc(lang==="ar"?l.name_ar:l.name_en)}</b>
         ${l.sugar!=null?`<span class="sug">${dots(l.sugar)}<em>${esc(nm(SUG[l.sugar]))}</em></span>`:""}
         ${l.milk?`<span class="sug">🥛<em>${t("withMilk")}</em></span>`:""}
         ${l.note?`<div class="note">✎ ${esc(l.note)}</div>`:""}</span></div>`).join("")}
       <div class="tft">${o.status==="new"
         ?(rejectingOrder===o.order_no
           ?`<div class="reject-picker">
               <button class="b-reason" onclick="pickRejectReason('${o.order_no}','${t("reasonUnavailable")}')">${t("reasonUnavailable")}</button>
               <button class="b-reason" onclick="pickRejectReason('${o.order_no}','${t("reasonOutOfStock")}')">${t("reasonOutOfStock")}</button>
               <div class="reject-custom">
                 <input class="inp" placeholder="${t("reasonOtherPH")}" oninput="setRejectCustom(this.value)">
                 <button class="b-s sm" onclick="confirmRejectCustom('${o.order_no}')">${t("confirmReject")}</button>
               </div>
               <button class="b-cancel" onclick="cancelReject()">${t("cancel")}</button>
             </div>`
           :`<button class="b-s" onclick="setSt('${o.order_no}','preparing')">${t("kStart")}</button>
           <button class="b-r" onclick="startReject('${o.order_no}')">${t("kReject")}</button>`)
         :`<button class="b-d" onclick="setSt('${o.order_no}','delivered')">${t("kDelivered")}</button>`}</div></div>`}).join("")
    :`<div class="kempty"><b>${t("kEmpty")}</b>${t("kEmptyB")}</div>`}</div></div>`;
}

render();
