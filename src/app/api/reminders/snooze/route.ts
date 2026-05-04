import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { reminderId, postId, minutes = 60 } = body as { reminderId?: string; postId?: string; minutes?: number };

  const newTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  if (reminderId) {
    await supabase
      .from("reminders")
      .update({ remind_at: newTime, sent: false })
      .eq("id", reminderId)
      .eq("user_id", user.id);
  } else if (postId) {
    await supabase.from("reminders").insert({
      user_id: user.id,
      post_id: postId,
      title: "Snooze — Post à publier",
      body: "Tu m'as demandé un rappel.",
      remind_at: newTime,
      recurrence: "NONE",
    });
  }
  return NextResponse.json({ ok: true });
}
