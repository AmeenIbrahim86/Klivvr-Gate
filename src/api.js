/**
 * api.js — طبقة الداتا
 *
 * ده الملف الوحيد اللي بيكلّم الـ backend. باقي التطبيق (main.js و kitchen.js)
 * بينادي الدوال دي بس، ومش عارف حاجة عن Supabase أو شكل الأعمدة في الـ database —
 * لو غيّرت الـ backend بعدين، بتعدّل الملف ده لوحده.
 *
 * كل دالة هنا بتاخد/بترجّع شكل الداتا اللي الواجهة (main.js) متعوّدة عليه
 * (مثلاً {ar, en, cat, price, sugar, avail, col, sq, site} لصنف بوفيه)
 * والتحويل من/لأسماء أعمدة الـ database (name_ar, name_en, category, ...) بيحصل هنا جوه.
 */
import { createClient } from '@supabase/supabase-js';

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ═══════════════ auth ═══════════════ */
export const auth = {
  // تسجيل الدخول بحساب مايكروسوفت (لازم تفعّل Azure provider في Supabase)
  signInMicrosoft: () => sb.auth.signInWithOAuth({
    provider: 'azure',
    options: { scopes: 'email profile openid', redirectTo: window.location.origin }
  }),
  signOut: () => sb.auth.signOut(),
  session: () => sb.auth.getSession().then(r => r.data.session),
  onChange: (cb) => sb.auth.onAuthStateChange((_e, s) => cb(s)),
};

/* ═══════════════ مين أنا وإيه صلاحياتي ═══════════════ */
export async function loadMe() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await sb.from('profiles')
    .select('id, full_name, role_id, branch_id').eq('id', user.id).single();
  if (error) throw error;

  const { data: perms } = await sb.from('role_permissions')
    .select('section').eq('role_id', profile.role_id);

  return {
    id: profile.id, email: user.email,
    ar: profile.full_name, en: profile.full_name,   // الاسم الحقيقي مش بيتترجم
    role: profile.role_id, site: profile.branch_id,
    perms: (perms || []).map(p => p.section)
  };
}

/* ═══════════════ الفروع والأدوار (بيانات مرجعية) ═══════════════ */
/* ═══════════════ إعدادات مفردة (زي "عن البوابة") ═══════════════ */
export async function getSetting(key) {
  const { data, error } = await sb.from('app_settings').select('*').eq('key', key).maybeSingle();
  if (error) throw error;
  return data ? { ar: data.value_ar || '', en: data.value_en || '' } : { ar: '', en: '' };
}
export async function setSetting(key, valueAr, valueEn) {
  const { error } = await sb.from('app_settings')
    .upsert({ key, value_ar: valueAr, value_en: valueEn, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function listBranches() {
  const { data, error } = await sb.from('branches')
    .select('id, name_ar, name_en, is_live, sort').order('sort');
  if (error) throw error;
  return data.map(b => ({ id: b.id, ar: b.name_ar, en: b.name_en, live: b.is_live }));
}

// row.isNew=true → إنشاء فرع جديد (لازم id فريد يكتبه الأدمن بنفسه)
export async function upsertBranch(row) {
  const dbRow = { name_ar: row.ar, name_en: row.en, is_live: !!row.live };
  if (row.isNew) {
    const { data, error } = await sb.from('branches')
      .insert({ id: row.id, ...dbRow, sort: row.sort ?? 0 }).select().single();
    if (error) throw error;
    return { id: data.id, ar: data.name_ar, en: data.name_en, live: data.is_live };
  }
  const { data, error } = await sb.from('branches').update(dbRow).eq('id', row.id).select().single();
  if (error) throw error;
  return { id: data.id, ar: data.name_ar, en: data.name_en, live: data.is_live };
}
export async function removeBranch(id) {
  const { error } = await sb.from('branches').delete().eq('id', id);
  if (error) throw error;
}

export async function loadRoles() {
  const [{ data: roles, error: e1 }, { data: perms, error: e2 }] = await Promise.all([
    sb.from('roles').select('*'),
    sb.from('role_permissions').select('*'),
  ]);
  if (e1) throw e1; if (e2) throw e2;
  return roles.map(r => ({
    id: r.id, ar: r.name_ar, en: r.name_en,
    perms: perms.filter(p => p.role_id === r.id).map(p => p.section)
  }));
}

export async function listProfiles() {
  const { data, error } = await sb.from('profiles')
    .select('id, full_name, role_id, branch_id').order('created_at');
  if (error) throw error;
  return data.map(p => ({ id: p.id, ar: p.full_name, en: p.full_name, role: p.role_id, site: p.branch_id }));
}

export async function setUserRole(userId, roleId) {
  const { error } = await sb.from('profiles').update({ role_id: roleId }).eq('id', userId);
  if (error) throw error;
}
export async function setUserBranch(userId, branchId) {
  const { error } = await sb.from('profiles').update({ branch_id: branchId }).eq('id', userId);
  if (error) throw error;
}
export async function setRolePermission(roleId, section, on) {
  const q = on
    ? sb.from('role_permissions').insert({ role_id: roleId, section })
    : sb.from('role_permissions').delete().eq('role_id', roleId).eq('section', section);
  const { error } = await q;
  if (error) throw error;
}

/* ═══════════════ محتوى البوابة + قائمة البوفيه ═══════════════ */
const TABLES = { news: 'news', links: 'quick_links', policies: 'policies', events: 'events', menu: 'menu_items' };

// تحويل بين شكل الواجهة (اللي main.js بيستخدمه) وأسماء أعمدة الـ database
const MAP = {
  news: {
    toDb: r => ({ tag_ar: r.tagAR || '', tag_en: r.tagEN || '', title_ar: r.titleAR, title_en: r.titleEN,
      body_ar: r.bodyAR || '', body_en: r.bodyEN || '', author: r.author || '', published_on: r.date || '',
      image_url: r.image || null }),
    fromDb: r => ({ id: r.id, tagAR: r.tag_ar, tagEN: r.tag_en, titleAR: r.title_ar, titleEN: r.title_en,
      bodyAR: r.body_ar, bodyEN: r.body_en, author: r.author, date: r.published_on, image: r.image_url }),
  },
  links: {
    toDb: r => ({ label_ar: r.ar, label_en: r.en, icon: r.icon || '', url: r.url || '#' }),
    fromDb: r => ({ id: r.id, ar: r.label_ar, en: r.label_en, icon: r.icon, url: r.url }),
  },
  policies: {
    toDb: r => ({ title_ar: r.ar, title_en: r.en, department: r.dept || '', version: r.ver || '', effective_on: r.date || '' }),
    fromDb: r => ({ id: r.id, ar: r.title_ar, en: r.title_en, dept: r.department, ver: r.version, date: r.effective_on }),
  },
  events: {
    toDb: r => ({ title_ar: r.ar, title_en: r.en, place_ar: r.placeAR || '', place_en: r.placeEN || '',
      day: r.day || '', month_ar: r.monAR || '', month_en: r.monEN || '', image_url: r.image || null }),
    fromDb: r => ({ id: r.id, ar: r.title_ar, en: r.title_en, placeAR: r.place_ar, placeEN: r.place_en,
      day: r.day, monAR: r.month_ar, monEN: r.month_en, image: r.image_url }),
  },
  menu: {
    toDb: r => ({ name_ar: r.ar, name_en: r.en, category: r.cat, price: Number(r.price) || 0,
      has_sugar: !!r.sugar, has_milk: !!r.milk, is_available: r.avail !== false, colour: r.col || '#B5651D', is_square: !!r.sq,
      icon: r.icon || null, branch_id: (!r.site || r.site === 'all') ? null : r.site }),
    fromDb: r => ({ id: r.id, ar: r.name_ar, en: r.name_en, cat: r.category, price: Number(r.price),
      sugar: r.has_sugar, milk: r.has_milk, avail: r.is_available, col: r.colour, sq: r.is_square,
      icon: r.icon, site: r.branch_id || 'all' }),
  },
};

export async function list(kind) {
  const orderCol = kind === 'news' ? 'created_at' : 'sort';
  const { data, error } = await sb.from(TABLES[kind]).select('*')
    .order(orderCol, { ascending: kind !== 'news' });
  if (error) throw error;
  return data.map(MAP[kind].fromDb);
}

// row.id موجود = تعديل صنف قائم، من غير id = إنشاء صنف جديد (الـ id بيتولّد من الـ database)
export async function upsert(kind, row) {
  const table = TABLES[kind], dbRow = MAP[kind].toDb(row);
  if (row.id) {
    const { data, error } = await sb.from(table).update(dbRow).eq('id', row.id).select().single();
    if (error) throw error;
    return MAP[kind].fromDb(data);
  }
  const { data, error } = await sb.from(table).insert(dbRow).select().single();
  if (error) throw error;
  return MAP[kind].fromDb(data);
}

export async function remove(kind, id) {
  const { error } = await sb.from(TABLES[kind]).delete().eq('id', id);
  if (error) throw error;
}

/* ═══════════════ الطلبات (الموظف) ═══════════════ */
export async function submitOrder({ branchId, requesterName, location, lines }) {
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const { data: { user } } = await sb.auth.getUser();

  const { data: order, error } = await sb.from('orders').insert({
    branch_id: branchId, requester_id: user.id,
    requester_name: requesterName, location, total
  }).select().single();
  if (error) throw error;

  const { error: e2 } = await sb.from('order_items').insert(
    lines.map(l => ({
      order_id: order.id, menu_item_id: l.menuItemId,
      name_ar: l.nameAr, name_en: l.nameEn,
      qty: l.qty, sugar_level: l.sugar, milk: l.milk ?? null, note: l.note,
      line_total: l.price * l.qty
    }))
  );
  if (e2) throw e2;
  return order.order_no;
}

// لإحصائيات لوحة الإدارة بس — st بترجع new/prog/done عشان تتوافق مع اللي الواجهة متعوّدة عليه
export async function listOrders(limit = 300) {
  const { data, error } = await sb.from('orders')
    .select('order_no, branch_id, status, created_at')
    .order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data.map(o => ({
    no: o.order_no, site: o.branch_id,
    st: o.status === 'preparing' ? 'prog' : (o.status === 'new' ? 'new' : 'done'),
    at: new Date(o.created_at).getTime()
  }));
}

/* ═══════════════ شاشة البوفيه — بدون تسجيل دخول، بباسورد بدل توكن ═══════════════ */
// الفرع بييجي من الـ URL: /kitchen.html?branch=kat — الباسورد بيتكتب في الشاشة نفسها
export const branchFromUrl = () => new URLSearchParams(location.search).get('branch');

export async function kitchenLogin(branch, password) {
  const { data, error } = await sb.rpc('kitchen_login', { _branch: branch, _password: password });
  if (error) throw error;
  return !!data;
}
export async function kitchenBoard(branch, password) {
  const { data, error } = await sb.rpc('kitchen_board', { _branch: branch, _password: password });
  if (error) throw error;
  return data;
}
export async function kitchenSetStatus(branch, password, orderNo, status) {
  const { error } = await sb.rpc('kitchen_set_status', {
    _branch: branch, _password: password, _order_no: orderNo, _status: status
  });
  if (error) throw error;
}

// تغيير باسورد شاشة فرع — للأدمن بس (الدالة نفسها بترفض أي حد مالوش صلاحية access)
export async function setScreenPassword(branch, newPassword) {
  const { error } = await sb.rpc('set_screen_password', { _branch: branch, _new_password: newPassword });
  if (error) throw error;
}

// Realtime — الشاشة تتحدّث لحظياً بدل ما تستنى الـ 30 ثانية بتاعت الـ polling
export function watchOrders(branch, onChange) {
  return sb.channel('kitchen-' + (branch || 'x'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, onChange)
    .subscribe();
}

/* ═══════════════ الهيكل التنظيمي (متزامن من Entra ID) ═══════════════ */
export async function listOrgPeople() {
  const { data, error } = await sb.from('org_people').select('*').order('display_name');
  if (error) throw error;
  return data.map(p => ({
    id: p.id, name: p.display_name, title: p.job_title, managerId: p.manager_id,
    email: p.email, phone: p.phone, location: p.office_location
  }));
}

// بينادي Edge Function اسمها sync-org، اللي بتسحب الداتا من Microsoft Graph
// بصلاحيات التطبيق (مش صلاحيتك انت) وبتحدّث الجدول. الدالة نفسها بترفض
// أي حد مالوش صلاحية "access" حتى لو حاول يناديها مباشرة.
export async function syncOrgFromEntra() {
  const { data, error } = await sb.functions.invoke('sync-org');
  if (error) throw error;
  return data;
}

/* ═══════════════ الصور (رفع حقيقي + معرض الصور) ═══════════════ */
// بيرفع الملف فعليًا على Supabase Storage ويرجّع لينك عام للصورة
export async function uploadImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

export async function listGallery() {
  const { data, error } = await sb.from('gallery').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(g => ({ id: g.id, url: g.image_url, caption: g.caption, at: g.created_at }));
}
export async function addGalleryPhoto(url, caption) {
  const { data, error } = await sb.from('gallery').insert({ image_url: url, caption: caption || null }).select().single();
  if (error) throw error;
  return { id: data.id, url: data.image_url, caption: data.caption, at: data.created_at };
}
export async function removeGalleryPhoto(id) {
  const { error } = await sb.from('gallery').delete().eq('id', id);
  if (error) throw error;
}
