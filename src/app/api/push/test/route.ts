import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToMany } from "@/lib/web-push";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ error: "Aucun appareil abonné" }, { status: 400 });
  }

  await sendPushToMany(subs, {
    title: "🎯 Editorial Calendar",
    body: "Tes notifications push fonctionnent parfaitement.",
    tag: "test",
    data: { url: "/dashboard" },
  });

  return NextResponse.json({ ok: true, sent: subs.length });
}
