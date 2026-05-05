import { AppShell } from "@/components/app-shell";
import { DataLoader } from "@/components/data-loader";
import { QuickAdd } from "@/components/quick-add";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataLoader>
      <AppShell>{children}</AppShell>
      <QuickAdd />
    </DataLoader>
  );
}
