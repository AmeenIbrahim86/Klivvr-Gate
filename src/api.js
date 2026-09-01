/**
 * api.js — طبقة الداتا
 *
 * ده الملف الوحيد اللي بيكلّم الـ backend. باقي التطبيق بينادي الدوال دي
 * ومش عارف حاجة عن Supabase — يعني لو غيّرت الـ backend بعدين، بتعدّل
 * الملف ده لوحده.
 *
 * VITE_USE_MOCK=true  →  يشتغل من غير backend (زي الـ prototype)
 */
import { createClient } from '@supabase/supabase-js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const sb = USE_MOCK ? null : createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ─────────── auth ─────────── */
export const auth = {
  // تسجيل الدخول بحساب مايكروسوفت (لازم تفعّل Azure provider في Supabase)
  signInMicrosoft: () => sb.auth.signInWithOAuth({
    provider: 'azure',
    options: { scopes: 'email profile openid', redirectTo: window.location.origin }
  }),
  signInEmail: (email) => sb.auth.signInWithOtp({ email }),
  signOut: () => sb.auth.signOut(),
  session: () => sb.auth.getSession().then(r => r.data.session),
  onChange: (cb) => sb.auth.onAuthStateChange((_e, s) => cb(s)),
};

/* ─────────── مين أنا وإيه صلاحياتي ─────────── */
export async function loadMe() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await sb.from('profiles')
    .select('id, full_name, role_id, branch_id').eq('id', user.id).single();

  const { data: perms } = await sb.from('role_permissions')
    .select('section').eq('role_id', profile.role_id);

  return { ...profile, email: user.email, perms: (perms || []).map(p => p.section) };
}

/* ─────────── محتوى البوابة ─────────── */
const TABLES = { news: 'news', links: 'quick_links', policies: 'policies', events: 'events', menu: 'menu_items' };

export async function list(kind) {
  const { data, error } = await sb.from(TABLES[kind]).select('*').order('sort');
  if (error) throw error;
  return data;
}
export async function upsert(kind, row) {
  const { data, error } = await sb.from(TABLES[kind]).upsert(row).select().single();
  if (error) throw error;
  return data;
}
export async function remove(kind, id) {
  const { error } = await sb.from(TABLES[kind]).delete().eq('id', id);
  if (error) throw error;
}

/* ─────────── الطلبات (الموظف) ─────────── */
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
      qty: l.qty, sugar_level: l.sugar, note: l.note,
      line_total: l.price * l.qty
    }))
  );
  if (e2) throw e2;
  return order;
}

export async function myOrders() {
  const { data, error } = await sb.from('orders')
    .select('*, order_items(*)').order('created_at', { ascending: false }).limit(20);
  if (error) throw error;
  return data;
}

/* ─────────── شاشة البوفيه — بدون تسجيل دخول ─────────── */
// التوكن بييجي من الـ URL:  /kitchen.html?token=xxxxx
export const displayToken = () => new URLSearchParams(location.search).get('token');

export async function kitchenBoard() {
  const { data, error } = await sb.rpc('kitchen_board', { _token: displayToken() });
  if (error) throw error;
  return data;
}
export async function kitchenSetStatus(orderNo, status) {
  const { error } = await sb.rpc('kitchen_set_status', {
    _token: displayToken(), _order_no: orderNo, _status: status
  });
  if (error) throw error;
}

// Realtime — الشاشة تتحدّث لحظياً بدل polling
export function watchOrders(onChange) {
  return sb.channel('kitchen')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, onChange)
    .subscribe();
}

/* ─────────── الصلاحيات (الأدمن) ─────────── */
export async function setRolePermission(roleId, section, on) {
  return on
    ? sb.from('role_permissions').insert({ role_id: roleId, section })
    : sb.from('role_permissions').delete().eq('role_id', roleId).eq('section', section);
}
export async function setUserRole(userId, roleId) {
  const { error } = await sb.from('profiles').update({ role_id: roleId }).eq('id', userId);
  if (error) throw error;
}
