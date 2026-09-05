// supabase/functions/create-local-user/index.ts
//
// إنشاء حساب محلي (إيميل + باسورد، من غير Microsoft) — مفيد لفريق
// البوفيه في كل فرع لو معهمش إيميل شركة. لازم Email/Password provider
// يكون مفعّل من Supabase Dashboard → Authentication → Providers → Email.
//
// الأسرار المطلوبة: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
// (كلهم متوفرين تلقائيًا لأي Edge Function).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // بس اللي معاه صلاحية access يقدر ينشئ حسابات محلية
    const { data: profile } = await admin.from("profiles").select("role_id").eq("id", user.id).single();
    const { data: perms } = await admin.from("role_permissions").select("section").eq("role_id", profile?.role_id || "");
    const allowed = (perms || []).some((p: any) => p.section === "access");
    if (!allowed) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const { email, password, fullName, roleId, branchId } = body;
    if (!email || !password || !fullName) return json({ error: "missing_fields", message: "لازم إيميل وباسورد واسم" }, 400);
    if (String(password).length < 8) return json({ error: "weak_password", message: "الباسورد لازم يكون ٨ حروف على الأقل" }, 400);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (createErr) return json({ error: "create_failed", message: createErr.message }, 400);

    const { error: profErr } = await admin.from("profiles").upsert({
      id: created.user!.id, full_name: fullName, role_id: roleId || "viewer", branch_id: branchId || null,
    });
    if (profErr) return json({ error: "profile_failed", message: profErr.message }, 500);

    return json({ ok: true, id: created.user!.id });
  } catch (e) {
    return json({ error: "unexpected", detail: String(e) }, 500);
  }
});
