/**
 * kitchen.js — شاشة البوفيه، بدون تسجيل دخول بحساب Microsoft
 *
 * الفرع بيتحدد من الـ URL (?branch=kat) — اللينك نفسه عادي ومش سري.
 * الحماية الحقيقية باسورد بيتكتب على الشاشة نفسها، والأدمن يقدر يغيّره
 * في أي وقت من لوحة الإدارة (Overview) من غير ما يلمس الكود أو الـ SQL.
 * الباسورد بيتفضّل في الجهاز نفسه (sessionStorage) عشان الشاشة متطلبش
 * الباسورد تاني كل ما الصفحة تتحدّث لوحدها.
 */
import { branchFromUrl, kitchenLogin, kitchenBoard, kitchenClosedBoard, kitchenSetStatus, kitchenReport, watchOrders } from './api.js';

const L = { ar: {
 title:"شاشة البوفيه", noLogin:"بدون تسجيل دخول",
 kNew:"جديد", kProg:"بيتحضّر",
 kStart:"ابدأ التحضير", kDelivered:"اتسلّم ✓", kReject:"رفض",
 kEmpty:"مفيش طلبات مفتوحة", kEmptyB:"الطلبات الجديدة هتظهر هنا لوحدها", withMilk:"بلبن", withMint:"بنعناع", cashDue:"كاش لسه",
 noBranch:"اللينك ده ناقصه الفرع", noBranchB:"كلّم الأدمن يديك لينك الشاشة الصح لفرعك.",
 enterPw:"باسورد الشاشة", enterPwB:"اكتب باسورد شاشة الفرع ده.",
 pwPH:"الباسورد", unlock:"دخول", wrongPw:"الباسورد غلط، جرّب تاني.",
 reasonUnavailable:"غير متوفر", reasonOutOfStock:"خلص من المخزون", reasonOtherPH:"سبب تاني...",
 confirmReject:"تأكيد الرفض", cancel:"إلغاء",
 reports:"التقارير", backToBoard:"رجوع للطلبات", from:"من", to:"لحد", show:"عرض", exportCsv:"تصدير CSV",
 pickRangeHint:"اختار المدة ودوس عرض.", noOrdersInRange:"مفيش طلبات في المدة دي.",
 totalOrders:"عدد الطلبات", totalRevenue:"الإجمالي", order:"الطلب", name:"الاسم", total:"القيمة",
 payment:"طريقة الدفع", status:"الحالة", date:"التاريخ", payCash:"كاش", loading:"بيحمّل…",
 closedOrders:"الطلبات المقفولة", closedOrdersHint:"آخر ٥٠ طلب اتسلّم أو اترفض", noClosedOrders:"لسه مفيش طلبات مقفولة",
 closedDelivered:"اتسلّم", closedRejected:"مرفوض", rejectedBecause:"سبب الرفض", today:"النهاردة",
},en:{
 title:"Buffet screen", noLogin:"No sign-in needed",
 kNew:"NEW", kProg:"PREPARING",
 kStart:"Start preparing", kDelivered:"Delivered ✓", kReject:"Reject",
 kEmpty:"No open orders", kEmptyB:"New orders appear here on their own", withMilk:"With milk", withMint:"With mint", cashDue:"Cash due",
 noBranch:"This link is missing a branch", noBranchB:"Ask an admin for your branch's screen link.",
 enterPw:"Screen password", enterPwB:"Enter this branch's screen password.",
 pwPH:"Password", unlock:"Unlock", wrongPw:"Wrong password, try again.",
 reasonUnavailable:"Not available", reasonOutOfStock:"Out of stock", reasonOtherPH:"Other reason...",
 confirmReject:"Confirm rejection", cancel:"Cancel",
 reports:"Reports", backToBoard:"Back to orders", from:"From", to:"To", show:"Show", exportCsv:"Export CSV",
 pickRangeHint:"Pick a date range and click show.", noOrdersInRange:"No orders in this range.",
 totalOrders:"Total orders", totalRevenue:"Total", order:"Order", name:"Name", total:"Total",
 payment:"Payment", status:"Status", date:"Date", payCash:"Cash", loading:"Loading…",
 closedOrders:"Closed Orders", closedOrdersHint:"Last 50 delivered or rejected orders", noClosedOrders:"No closed orders yet",
 closedDelivered:"Delivered", closedRejected:"Rejected", rejectedBecause:"Rejected because", today:"Today",
}};

const branch = branchFromUrl();
const pwKey = "kitchen_pw_" + (branch || "x");
let lang="en", rows=[], unlocked=false, password="", loginErr="", checking=false;
let rejectingOrder=null, rejectCustom="";
let reportsOpen=false, reportFrom="", reportTo="", reportRows=null, reportLoading=false;
let closedOpen=false, closedRows=null, closedLoading=false, closedOpenDay=null;
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

function openReports(){
  reportsOpen=true; closedOpen=false;
  const today=new Date().toISOString().slice(0,10);
  if(!reportFrom) reportFrom=today;
  if(!reportTo) reportTo=today;
  render();
}
function closeReports(){ reportsOpen=false; render(); }
function setReportFrom(v){ reportFrom=v; }
function setReportTo(v){ reportTo=v; }
async function runReport(){
  if(!reportFrom||!reportTo) return;
  reportLoading=true; render();
  try{
    const from=new Date(reportFrom+"T00:00:00").toISOString();
    const to=new Date(reportTo+"T23:59:59.999").toISOString();
    reportRows=await kitchenReport(branch, password, from, to);
  }catch(e){ console.error(e); reportRows=[]; }
  reportLoading=false; render();
}
function csvEscape(v){
  v=String(v??"");
  return /[",\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v;
}
function exportCsv(){
  if(!reportRows||!reportRows.length) return;
  const headers=["Order","Name","Total","Payment","Status","Date"];
  const lines=[headers.join(",")];
  for(const r of reportRows){
    lines.push([r.order_no, r.requester_name, r.total,
      r.payment_method||"", r.status, new Date(r.created_at).toLocaleString()].map(csvEscape).join(","));
  }
  const blob=new Blob(["\uFEFF"+lines.join("\n")], {type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=`orders-${branch}-${reportFrom}-to-${reportTo}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
window.openReports=openReports; window.closeReports=closeReports;
window.setReportFrom=setReportFrom; window.setReportTo=setReportTo;
window.runReport=runReport; window.exportCsv=exportCsv;

function openClosed(){
  closedOpen=true; reportsOpen=false;
  if(!closedOpenDay) closedOpenDay=dayKey(new Date());
  render();
  if(closedRows===null) loadClosed();
}
function closeClosed(){ closedOpen=false; render(); }
async function loadClosed(){
  closedLoading=true; render();
  try{ closedRows=await kitchenClosedBoard(branch, password); }
  catch(e){ console.error(e); closedRows=[]; }
  closedLoading=false; render();
}
window.openClosed=openClosed; window.closeClosed=closeClosed;

function dayKey(d){ const dt=new Date(d); return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0"); }
function dayLabel(key){
  if(key===dayKey(new Date())) return t("today");
  const [y,m,d]=key.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString(lang==="ar"?"ar-EG":"en-US",{weekday:"short",month:"short",day:"numeric"});
}
function toggleClosedDay(key){ closedOpenDay = closedOpenDay===key?null:key; render(); }
window.toggleClosedDay=toggleClosedDay;

function itemLineHtml(l){
  const opt = lang==="ar" ? (l.option_ar||l.option_en) : (l.option_en||l.option_ar);
  return `<div class="tl"><span class="qn">${num(l.qty)}×</span>
    <span><b>${esc(lang==="ar"?l.name_ar:l.name_en)}</b>
    ${l.sugar!=null?`<span class="sug">${dots(l.sugar)}<em>${esc(nm(SUG[l.sugar]))}</em></span>`:""}
    ${l.milk?`<span class="sug">🥛<em>${t("withMilk")}</em></span>`:""}
    ${l.mint?`<span class="sug">🌿<em>${t("withMint")}</em></span>`:""}
    ${opt?`<span class="sug">🏷️<em>${esc(opt)}</em></span>`:""}
    ${l.note?`<div class="note">✎ ${esc(l.note)}</div>`:""}</span></div>`;
}
function renderClosed(){
  let groupsHtml="";
  if(!closedLoading && closedRows && closedRows.length){
    const groups={};
    for(const o of closedRows){ const k=dayKey(o.created_at); (groups[k]=groups[k]||[]).push(o); }
    const keys=Object.keys(groups).sort().reverse();
    groupsHtml = keys.map(k=>{
      const open=closedOpenDay===k;
      return `<div class="day-group">
        <button class="day-head" onclick="toggleClosedDay('${k}')">
          <span>${open?"▾":"▸"} ${dayLabel(k)}</span><span class="mono">${num(groups[k].length)}</span>
        </button>
        ${open?`<div class="kboard">${groups[k].map(o=>`<div class="ticket ${o.status==="rejected"?"late":""}">
            <div class="thd"><div class="t1"><span class="tno">${esc(o.order_no)}</span>
              <span class="timer">${o.status==="delivered"?"✓ "+t("closedDelivered"):"✕ "+t("closedRejected")}</span></div>
              <h4>${esc((lang==="ar"?o.requester_first_ar:o.requester_first_en)||o.requester_first_en||o.requester_first_ar||"")}</h4>
              <div class="where">${esc(o.location||"")} · <span class="mono">${esc(new Date(o.created_at).toLocaleTimeString(lang==="ar"?"ar-EG":"en-US",{timeStyle:"short"}))}</span></div></div>
            ${(o.items||[]).map(itemLineHtml).join("")}
            ${o.status==="rejected"&&o.rejection_reason?`<div class="tft" style="display:block"><p style="color:var(--coral-ink);font-size:12px;margin:0">${t("rejectedBecause")}: ${esc(o.rejection_reason)}</p></div>`:""}
          </div>`).join("")}</div>`:""}
      </div>`;
    }).join("");
  }
  return `<div class="kwrap"><div class="khead">
     <div><h2>${t("closedOrders")}</h2>
       <button class="reports-link" onclick="closeClosed()">← ${t("backToBoard")}</button></div>
     <span class="langsw">
       <button class="${lang==="ar"?"on":""}" onclick="setLang('ar')">ع</button>
       <button class="${lang==="en"?"on":""}" onclick="setLang('en')">EN</button></span>
   </div>
   <div class="report-panel">
     <p class="report-hint" style="text-align:start;padding:0 0 14px">${t("closedOrdersHint")}</p>
     ${closedLoading?`<p class="report-hint">${t("loading")}</p>`
      :!closedRows||!closedRows.length?`<p class="report-hint">${t("noClosedOrders")}</p>`
      :groupsHtml}
   </div></div>`;
}

function renderReports(){
  const rev = reportRows ? reportRows.reduce((s,r)=>s+Number(r.total||0),0) : 0;
  return `<div class="kwrap"><div class="khead">
     <div><h2>${t("reports")}</h2>
       <button class="reports-link" onclick="closeReports()">← ${t("backToBoard")}</button></div>
     <span class="langsw">
       <button class="${lang==="ar"?"on":""}" onclick="setLang('ar')">ع</button>
       <button class="${lang==="en"?"on":""}" onclick="setLang('en')">EN</button></span>
   </div>
   <div class="report-panel">
     <div class="report-filters">
       <label>${t("from")} <input type="date" class="inp" value="${esc(reportFrom)}" onchange="setReportFrom(this.value)"></label>
       <label>${t("to")} <input type="date" class="inp" value="${esc(reportTo)}" onchange="setReportTo(this.value)"></label>
       <button class="btn sm" onclick="runReport()">${t("show")}</button>
       <button class="btn ghost sm" ${reportRows&&reportRows.length?"":"disabled"} onclick="exportCsv()">⬇ ${t("exportCsv")}</button>
     </div>
     ${reportLoading?`<p class="report-hint">${t("loading")}</p>`
      :reportRows===null?`<p class="report-hint">${t("pickRangeHint")}</p>`
      :reportRows.length===0?`<p class="report-hint">${t("noOrdersInRange")}</p>`
      :`<div class="report-summary">${t("totalOrders")}: <b>${num(reportRows.length)}</b> &nbsp;·&nbsp; ${t("totalRevenue")}: <b>${num(rev)} EGP</b></div>
        <div class="report-table-wrap"><table class="report-table"><thead><tr>
          <th>${t("order")}</th><th>${t("name")}</th><th>${t("total")}</th><th>${t("payment")}</th><th>${t("status")}</th><th>${t("date")}</th>
        </tr></thead><tbody>${reportRows.map(r=>`<tr>
          <td class="mono">${esc(r.order_no)}</td><td>${esc(r.requester_name)}</td>
          <td class="mono">${num(r.total)}</td>
          <td>${r.payment_method==="cash"?"💵 "+t("payCash"):r.payment_method==="instapay"?"📱 InstaPay":"—"}</td>
          <td>${esc(r.status)}</td><td class="mono">${esc(new Date(r.created_at).toLocaleString())}</td>
        </tr>`).join("")}</tbody></table></div>`}
   </div></div>`;
}
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

  if(reportsOpen){ $("#app").innerHTML = renderReports(); return; }
  if(closedOpen){ $("#app").innerHTML = renderClosed(); return; }

  const d=new Date(), clk=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
  const newCount = rows.filter(r=>r.status==="new").length;
  const progCount = rows.filter(r=>r.status==="preparing").length;

  $("#app").innerHTML = `<div class="kwrap"><div class="khead">
     <div><h2>${t("title")}</h2>
       <div class="sub">AUTO-REFRESH · 30s <span class="nologin">${t("noLogin")}</span>
       <button class="reports-link" onclick="openReports()">📊 ${t("reports")}</button>
       <button class="reports-link" onclick="openClosed()">📋 ${t("closedOrders")}</button>
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
       ${(o.items||[]).map(itemLineHtml).join("")}
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
