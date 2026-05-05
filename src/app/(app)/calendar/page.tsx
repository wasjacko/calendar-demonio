"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CalendarView } from "@/components/calendar/calendar-view";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
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
    <div className="px-4 sm:px-6 py-5 max-w-7xl mx-auto">
      <CalendarToolbar />
      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-12">Chargement…</p>
      ) : (
        <CalendarView />
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
