import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { DataLoader } from "@/components/data-loader";
import { PostEditor } from "@/components/post-editor";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <DataLoader>
      <AppShell userEmail={user.email ?? undefined}>{children}</AppShell>
      <PostEditor />
    </DataLoader>
  );
}
