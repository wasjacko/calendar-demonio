"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KanbanWeek } from "@/components/calendar/kanban-week";
import { useUIStore, useDataStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function CalendarPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { openEditor } = useUIStore();
  const loading = useDataStore((s) => s.loading);

  React.useEffect(() => {
    if (params.get("new") === "1") {
      openEditor();
      router.replace("/calendar");
    }
  }, [params, openEditor, router]);

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-3xl mx-auto">
      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-12">Chargement…</p>
      ) : (
        <KanbanWeek />
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <React.Suspense fallback={<p className="text-center text-sm text-muted-foreground py-12">Chargement…</p>}>
      <CalendarPageInner />
    </React.Suspense>
  );
}
