// supabase/functions/sync-org/index.ts
//
// بيسحب كل موظفي الشركة ومديريهم من Microsoft Graph ويحدّث جدول org_people.
// اتصاله بـ Graph بصلاحيات التطبيق (Application permission) مش بصلاحيات موظف
// معيّن، فمش محتاج حد يكون مسجّل دخول عشان يشتغل — بس بننادي بيه من التطبيق
// بحساب أدمن بس (اتأكدنا من ده جوه الكود تحت).
//
// الأسرار المطلوبة (Edge Functions → sync-org → Secrets):
//   AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
// SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY متوفرين تلقائياً، مش محتاج تضيفهم.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ── 1) لازم اللي بينادي الدالة يكون مسجّل دخول وعنده صلاحية "access" ──
    const authHeader = req.headers.get("Authorization") || "";
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: profile } = await admin.from("profiles")
      .select("role_id").eq("id", user.id).single();
    const { data: perm } = await admin.from("role_permissions")
      .select("section").eq("role_id", profile?.role_id ?? "").eq("section", "access")
      .maybeSingle();
    if (!perm) return json({ error: "forbidden — needs the access permission" }, 403);

    // ── 2) هات app-only token من Entra ID (client credentials) ──
    const tenant = Deno.env.get("AZURE_TENANT_ID")!;
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: Deno.env.get("AZURE_CLIENT_ID")!,
          client_secret: Deno.env.get("AZURE_CLIENT_SECRET")!,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      },
    );
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return json({ error: "Graph auth failed", detail: tokenJson }, 500);
    }
    const gh = { Authorization: `Bearer ${accessToken}` };

    // ── 3) هات كل المستخدمين (بترقيم صفحات لو الشركة كبيرة) ──
    type GUser = { id: string; displayName?: string; jobTitle?: string; accountEnabled?: boolean;
      mail?: string; mobilePhone?: string; businessPhones?: string[]; officeLocation?: string };
    let users: GUser[] = [];
    let url: string | null =
      "https://graph.microsoft.com/v1.0/users?$select=id,displayName,jobTitle,accountEnabled,mail,mobilePhone,businessPhones,officeLocation&$top=999";
    while (url) {
      const r: Response = await fetch(url, { headers: gh });
      const j = await r.json();
      if (j.error) return json({ error: "Graph users list failed", detail: j.error }, 500);
      users.push(...(j.value || []));
      url = j["@odata.nextLink"] || null;
    }
    users = users.filter((u) => u.accountEnabled !== false);

    // ── 4) هات مدير كل واحد، ٢٠ في كل batch request لتقليل عدد النداءات ──
    const managerOf: Record<string, string | null> = {};
    for (let i = 0; i < users.length; i += 20) {
      const chunk = users.slice(i, i + 20);
      const body = {
        requests: chunk.map((u, idx) => ({
          id: String(idx), method: "GET", url: `/users/${u.id}/manager?$select=id`,
        })),
      };
      const br = await fetch("https://graph.microsoft.com/v1.0/$batch", {
        method: "POST",
        headers: { ...gh, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const bj = await br.json();
      for (const resp of (bj.responses || [])) {
        const u = chunk[Number(resp.id)];
        managerOf[u.id] = resp.status === 200 ? (resp.body?.id ?? null) : null;
      }
    }

    // ── 5) صور الموظفين — بترفع على Supabase Storage والرابط بس هو اللي بيتحفظ ──
    const photoUrlOf: Record<string, string | null> = {};
    const CONCURRENCY = 8;
    for (let i = 0; i < users.length; i += CONCURRENCY) {
      const chunk = users.slice(i, i + CONCURRENCY);
      await Promise.all(chunk.map(async (u) => {
        try {
          const pr = await fetch(
            `https://graph.microsoft.com/v1.0/users/${u.id}/photos/120x120/$value`,
            { headers: gh },
          );
          if (pr.status !== 200) return; // مفيش صورة متسجّلة للشخص ده، عادي
          const bytes = new Uint8Array(await pr.arrayBuffer());
          const path = `org-photos/${u.id}.jpg`;
          const { error: upErr } = await admin.storage.from("media")
            .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
          if (!upErr) {
            const { data } = admin.storage.from("media").getPublicUrl(path);
            photoUrlOf[u.id] = data.publicUrl;
          }
        } catch (_e) { /* صورة الشخص ده بس اللي هتفضل فاضية، الباقي مش بيتأثر */ }
      }));
    }

    // ── 6) اكتب في org_people (upsert واحد لكل الصفوف) ──
    const rows = users.map((u) => ({
      id: u.id,
      display_name: u.displayName || "",
      job_title: u.jobTitle || "",
      email: u.mail || null,
      phone: u.mobilePhone || (u.businessPhones && u.businessPhones[0]) || null,
      office_location: u.officeLocation || null,
      photo_url: photoUrlOf[u.id] || null,
      manager_id: managerOf[u.id] || null,
      synced_at: new Date().toISOString(),
    }));
    if (rows.length) {
      const { error } = await admin.from("org_people").upsert(rows);
      if (error) return json({ error: "DB upsert failed", detail: error.message }, 500);
    }

    return json({ ok: true, count: rows.length });
  } catch (e) {
    return json({ error: "unexpected", detail: String(e) }, 500);
  }
});
