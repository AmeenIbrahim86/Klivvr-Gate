// supabase/functions/room-booking/index.ts
//
// حجز قاعات الاجتماعات — بيتكلم مع تقويمات الـ Resource Mailboxes الحقيقية
// بتاعة القاعات في Microsoft 365 مباشرة. مفيش جدول حجوزات عندنا خالص —
// كل قراءة وكل حجز بيحصل مباشرة في تقويم Microsoft، فمفيش احتمال تعارض
// أو نسخة قديمة عن اللي فعلاً في Outlook.
//
// الأسرار المطلوبة (Edge Functions → room-booking → Secrets):
//   AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
// (ممكن تستخدم نفس الـ App Registration بتاع sync-org، بس لازم تضيف صلاحية
//  Application: Calendars.ReadWrite ليها وتاخد admin consent من جديد)
// SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY متوفرين تلقائياً.

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

const TZ = "Egypt Standard Time";       // اسم التايم زون اللي Graph بيفهمه (القاهرة)
const BUSINESS_START = 9;               // الساعة ٩ صباحًا
const BUSINESS_END = 18;                // لحد الساعة ٦ مساءً
const SLOT_MINUTES = 30;
const DAILY_CAP_MINUTES = 120;          // أقصى حجز مسموح للموظف الواحد في اليوم
const WORKING_WEEKDAYS = [0,1,2,3,4];   // الأحد(0) للخميس(4) — نفس أيام عمل القاعات في Microsoft
function weekdayOf(dateStr: string){ const [y,m,d]=dateStr.split("-").map(Number); return new Date(Date.UTC(y,m-1,d)).getUTCDay(); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ── لازم اللي بينادي يكون مسجّل دخول (أي موظف، مش أدمن بس) ──
    const authHeader = req.headers.get("Authorization") || "";
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user || !user.email) return json({ error: "unauthorized" }, 401);
    const employeeEmail = user.email;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // ── هات قائمة القاعات + إيميلاتها الحقيقية من الداتابيز ──
    const { data: rooms, error: roomsErr } = await admin
      .from("meeting_rooms").select("id, name, email").order("sort");
    if (roomsErr) return json({ error: "rooms lookup failed", detail: roomsErr }, 500);
    const roomsWithEmail = (rooms || []).filter((r: any) => r.email);
    if (!roomsWithEmail.length) {
      return json({ error: "no_rooms_configured", message: "لسه مفيش إيميل متحطّ لأي قاعة من الإدارة" }, 400);
    }

    // ── هات app-only token من Entra ID ──
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
    if (!accessToken) return json({ error: "Graph auth failed", detail: tokenJson }, 500);
    const gh = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    // ══════════════════════════════════════════════════════════
    //  action = "freebusy" — إمتى كل قاعة مشغولة في يوم معيّن
    // ══════════════════════════════════════════════════════════
    // الشركة شغّالة الأحد للخميس بس (زي سياسة الغرف نفسها في Microsoft)
    function isWorkDay(dateStr: string) {
      const d = new Date(dateStr + "T00:00:00Z").getUTCDay(); // 0=Sun ... 6=Sat
      return d >= 0 && d <= 4;
    }

    if (action === "freebusy") {
      const date: string = body.date; // "YYYY-MM-DD"
      if (!date) return json({ error: "date required" }, 400);
      if (!isWorkDay(date)) return json({ error: "weekend", message: "الغرف شغّالة من الأحد للخميس بس" }, 400);
      if (!WORKING_WEEKDAYS.includes(weekdayOf(date))) {
        return json({ error: "not_a_working_day", message: "القاعات شغّالة من الأحد للخميس بس" }, 400);
      }

      const startTime = `${date}T${String(BUSINESS_START).padStart(2, "0")}:00:00`;
      const endTime = `${date}T${String(BUSINESS_END).padStart(2, "0")}:00:00`;

      const schRes = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(employeeEmail)}/calendar/getSchedule`,
        {
          method: "POST",
          headers: gh,
          body: JSON.stringify({
            schedules: roomsWithEmail.map((r: any) => r.email),
            startTime: { dateTime: startTime, timeZone: TZ },
            endTime: { dateTime: endTime, timeZone: TZ },
            availabilityViewInterval: SLOT_MINUTES,
          }),
        },
      );
      const schJson = await schRes.json();
      if (schJson.error) return json({ error: "Graph getSchedule failed", detail: schJson.error }, 500);

      const byEmail: Record<string, string> = {};
      for (const item of schJson.value || []) {
        byEmail[item.scheduleId?.toLowerCase()] = item.availabilityView || "";
      }

      const totalSlots = Math.floor(((BUSINESS_END - BUSINESS_START) * 60) / SLOT_MINUTES);
      const result = roomsWithEmail.map((r: any) => {
        const view = byEmail[r.email.toLowerCase()] || "0".repeat(totalSlots);
        const slots = [];
        for (let i = 0; i < totalSlots; i++) {
          const mins = BUSINESS_START * 60 + i * SLOT_MINUTES;
          const h = Math.floor(mins / 60), m = mins % 60;
          slots.push({
            time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
            busy: (view[i] || "0") !== "0",
          });
        }
        return { id: r.id, name: r.name, slots };
      });

      return json({ rooms: result, slotMinutes: SLOT_MINUTES });
    }

    // ══════════════════════════════════════════════════════════
    //  action = "book" — احجز سلوت فعلي (بيتبعت في Outlook باسم الموظف)
    // ══════════════════════════════════════════════════════════
    if (action === "book") {
      const { roomId, date, startTime: st, endTime: et, subject, attendees } = body;
      if (!roomId || !date || !st || !et) return json({ error: "missing fields" }, 400);
      if (!subject || !String(subject).trim()) return json({ error: "subject_required", message: "لازم تكتب عنوان للاجتماع" }, 400);
      if (!isWorkDay(date)) return json({ error: "weekend", message: "الغرف شغّالة من الأحد للخميس بس" }, 400);
      if (!subject || !subject.trim()) return json({ error: "subject_required", message: "عنوان الاجتماع مطلوب" }, 400);
      if (!WORKING_WEEKDAYS.includes(weekdayOf(date))) {
        return json({ error: "not_a_working_day", message: "القاعات شغّالة من الأحد للخميس بس" }, 400);
      }

      const room = roomsWithEmail.find((r: any) => r.id === roomId);
      if (!room) return json({ error: "room_not_found" }, 404);

      const [sh, sm] = st.split(":").map(Number);
      const [eh, em] = et.split(":").map(Number);
      const durationMin = (eh * 60 + em) - (sh * 60 + sm);
      if (durationMin <= 0) return json({ error: "invalid_time_range" }, 400);
      if (sh < BUSINESS_START || eh > BUSINESS_END || (eh === BUSINESS_END && em > 0)) {
        return json({ error: "outside_business_hours", message: `الحجز لازم يكون بين ${BUSINESS_START}:00 و ${BUSINESS_END}:00` }, 400);
      }

      // ── اتأكد إن الموظف مخطاش حد الساعتين في اليوم ده (في أي قاعة) ──
      const dayStart = `${date}T00:00:00`;
      const dayEnd = `${date}T23:59:59`;
      const cvRes = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(employeeEmail)}/calendarView` +
        `?startDateTime=${dayStart}&endDateTime=${dayEnd}&$select=subject,start,end,location`,
        { headers: { ...gh, Prefer: `outlook.timezone="${TZ}"` } },
      );
      const cvJson = await cvRes.json();
      if (cvJson.error) return json({ error: "Graph calendarView failed", detail: cvJson.error }, 500);

      const roomNames = new Set(roomsWithEmail.map((r: any) => r.name));
      let usedMinutes = 0;
      for (const ev of cvJson.value || []) {
        if (!roomNames.has(ev.location?.displayName)) continue;
        const s = new Date(ev.start.dateTime + "Z").getTime();
        const e = new Date(ev.end.dateTime + "Z").getTime();
        usedMinutes += Math.round((e - s) / 60000);
      }
      if (usedMinutes + durationMin > DAILY_CAP_MINUTES) {
        return json({
          error: "daily_cap_exceeded",
          message: `أقصى حجز في اليوم ${DAILY_CAP_MINUTES / 60} ساعة — استخدمت ${Math.round(usedMinutes / 60 * 10) / 10} ساعة النهاردة`,
        }, 400);
      }

      // ── اعمل الحجز الفعلي: دعوة في تقويم الموظف، والقاعة كـ resource، وأي حد تاني اتضاف كـ attendee عادي ──
      const extraAttendees = Array.isArray(attendees)
        ? attendees.filter((e: unknown) => typeof e === "string" && e.includes("@"))
          .map((email: string) => ({ emailAddress: { address: email }, type: "required" }))
        : [];
      const evRes = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(employeeEmail)}/events`,
        {
          method: "POST",
          headers: gh,
          body: JSON.stringify({
            subject: subject || "Meeting",
            start: { dateTime: `${date}T${st}:00`, timeZone: TZ },
            end: { dateTime: `${date}T${et}:00`, timeZone: TZ },
            location: { displayName: room.name },
            attendees: [
              { emailAddress: { address: room.email, name: room.name }, type: "resource" },
              ...extraAttendees,
            ],
          }),
        },
      );
      const evJson = await evRes.json();
      if (evJson.error) {
        return json({ error: "graph_event_failed", message: evJson.error.message || "Microsoft رفض الحجز", detail: evJson.error }, 500);
      }

      return json({ ok: true, eventId: evJson.id });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    return json({ error: "unexpected", detail: String(e) }, 500);
  }
});
