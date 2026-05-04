import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToMany } from "@/lib/web-push";

export const runtime = "nodejs";

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID!;
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", ownerId);

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
