import { AppShell } from "@/components/app-shell";
import { DataLoader } from "@/components/data-loader";
import { PostEditor } from "@/components/post-editor";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataLoader>
      <AppShell>{children}</AppShell>
      <PostEditor />
    </DataLoader>
  );
}
