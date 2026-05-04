// Vercel Cron — exécuté chaque 5 minutes via vercel.json
// Envoie les rappels de posts programmés et les rappels personnalisés

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendPushToMany } from "@/lib/web-push";
import { FORMATS, FUNNEL_STAGES } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServerClient(url, secret, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}

export async function GET(request: NextRequest) {
  // Auth via Bearer token (Vercel Cron header)
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = adminClient();
  const now = new Date();
  const horizonAhead = new Date(now.getTime() + 5 * 60 * 1000);
  const lookbackStart = new Date(now.getTime() - 60 * 60 * 1000);
  let totalSent = 0;
  const results: Record<string, number> = {};

  // 1) Reminders custom dont l'heure approche
  const { data: reminders } = await supabase
    .from("reminders")
    .select("id, user_id, post_id, title, body, remind_at, recurrence")
    .eq("sent", false)
    .lte("remind_at", horizonAhead.toISOString())
    .gte("remind_at", lookbackStart.toISOString());

  for (const r of reminders ?? []) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", r.user_id);
    if (!subs || subs.length === 0) continue;

    const payload = {
      title: r.title,
      body: r.body ?? undefined,
      tag: `reminder-${r.id}`,
      requireInteraction: true,
      data: { url: r.post_id ? `/calendar?post=${r.post_id}` : "/dashboard", reminderId: r.id },
    };
    const res = await sendPushToMany(subs, payload);
    totalSent += res.filter((x) => x.ok).length;

    if (r.recurrence !== "NONE") {
      const next = computeNextOccurrence(new Date(r.remind_at), r.recurrence);
      await supabase.from("reminders").update({ remind_at: next.toISOString() }).eq("id", r.id);
    } else {
      await supabase.from("reminders").update({ sent: true }).eq("id", r.id);
    }
  }
  results.reminders = (reminders ?? []).length;

  // 2) Posts programmés dans la prochaine heure et notif "post à publier"
  const oneHourAhead = new Date(now.getTime() + 60 * 60 * 1000);
  const { data: settingsRows } = await supabase
    .from("settings")
    .select("user_id, default_reminder_minutes, notifications_enabled");
  const settingsByUser = new Map((settingsRows ?? []).map((s) => [s.user_id, s]));

  const { data: posts } = await supabase
    .from("posts")
    .select("id, user_id, title, scheduled_for, format, funnel_stage, status")
    .eq("status", "SCHEDULED")
    .gte("scheduled_for", now.toISOString())
    .lte("scheduled_for", oneHourAhead.toISOString());

  for (const post of posts ?? []) {
    const userSettings = settingsByUser.get(post.user_id);
    if (userSettings && userSettings.notifications_enabled === false) continue;
    const reminderMin = userSettings?.default_reminder_minutes ?? 60;
    const dueAt = new Date(new Date(post.scheduled_for!).getTime() - reminderMin * 60 * 1000);
    if (dueAt > now || dueAt < lookbackStart) continue;

    // Anti-doublon : tag unique par post
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", post.user_id);
    if (!subs || subs.length === 0) continue;

    const f = FORMATS[post.format as keyof typeof FORMATS];
    const stage = FUNNEL_STAGES[post.funnel_stage as keyof typeof FUNNEL_STAGES];

    await sendPushToMany(subs, {
      title: `${f.emoji} À publier dans ${reminderMin} min`,
      body: `${post.title} · ${stage.label}`,
      tag: `post-${post.id}`,
      requireInteraction: true,
      actions: [
        { action: "view", title: "Ouvrir" },
        { action: "snooze", title: "Snooze 1h" },
      ],
      data: { url: `/calendar?post=${post.id}`, postId: post.id },
    });
    totalSent += subs.length;
  }
  results.posts = (posts ?? []).length;

  // 3) Marquer comme MISSED les posts SCHEDULED dont l'heure est passée de + de 2h
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  await supabase
    .from("posts")
    .update({ status: "MISSED" })
    .eq("status", "SCHEDULED")
    .lt("scheduled_for", twoHoursAgo.toISOString());

  return NextResponse.json({ ok: true, totalSent, results, ranAt: now.toISOString() });
}

function computeNextOccurrence(from: Date, recurrence: "DAILY" | "WEEKLY" | "MONTHLY"): Date {
  const d = new Date(from);
  if (recurrence === "DAILY") d.setDate(d.getDate() + 1);
  else if (recurrence === "WEEKLY") d.setDate(d.getDate() + 7);
  else if (recurrence === "MONTHLY") d.setMonth(d.getMonth() + 1);
  return d;
}
