import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID!;

  const body = await request.json().catch(() => ({}));
  const { reminderId, postId, minutes = 60 } = body as { reminderId?: string; postId?: string; minutes?: number };

  const newTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  if (reminderId) {
    await supabase
      .from("reminders")
      .update({ remind_at: newTime, sent: false })
      .eq("id", reminderId)
      .eq("user_id", ownerId);
  } else if (postId) {
    await supabase.from("reminders").insert({
      user_id: ownerId,
      post_id: postId,
      title: "Snooze — Post à publier",
      body: "Tu m'as demandé un rappel.",
      remind_at: newTime,
      recurrence: "NONE",
    });
  }
  return NextResponse.json({ ok: true });
}
