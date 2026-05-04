// Vercel Cron — exécuté chaque jour (Hobby tier limit) via vercel.json
// Envoie les rappels de posts programmés pour les prochaines 24h

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToMany } from "@/lib/web-push";
import { FORMATS, FUNNEL_STAGES } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = adminClient();
  const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID!;
  const now = new Date();
  const horizonAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  let totalSent = 0;
  const results: Record<string, number> = {};

  // 1) Reminders custom dont l'heure est passée
  const { data: reminders } = await supabase
    .from("reminders")
    .select("id, post_id, title, body, remind_at, recurrence")
    .eq("user_id", ownerId)
    .eq("sent", false)
    .lte("remind_at", horizonAhead.toISOString());

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", ownerId);

  if (subs && subs.length > 0) {
    for (const r of reminders ?? []) {
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
  }
  results.reminders = (reminders ?? []).length;

  // 2) Posts programmés dans les prochaines 24h (briefing matinal)
  const { data: settingsRow } = await supabase
    .from("settings")
    .select("notifications_enabled")
    .eq("user_id", ownerId)
    .maybeSingle();

  if (settingsRow?.notifications_enabled !== false && subs && subs.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select("id, title, scheduled_for, format, funnel_stage")
      .eq("user_id", ownerId)
      .eq("status", "SCHEDULED")
      .gte("scheduled_for", now.toISOString())
      .lte("scheduled_for", horizonAhead.toISOString())
      .order("scheduled_for", { ascending: true });

    if (posts && posts.length > 0) {
      const list = posts.slice(0, 5).map((p) => {
        const f = FORMATS[p.format as keyof typeof FORMATS];
        return `${f.emoji} ${p.title}`;
      }).join("\n");

      await sendPushToMany(subs, {
        title: `📅 Aujourd'hui : ${posts.length} post${posts.length > 1 ? "s" : ""}`,
        body: list,
        tag: `daily-${now.toDateString()}`,
        requireInteraction: true,
        data: { url: "/calendar" },
      });
      totalSent += subs.length;
    }
    results.posts = posts?.length ?? 0;
  }

  // 3) Marquer comme MISSED les posts SCHEDULED dont l'heure est passée de + de 2h
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  await supabase
    .from("posts")
    .update({ status: "MISSED" })
    .eq("user_id", ownerId)
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
