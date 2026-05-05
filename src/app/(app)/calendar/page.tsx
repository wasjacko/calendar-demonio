"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CalendarView } from "@/components/calendar/calendar-view";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { useUIStore, useDataStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

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
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="size-6" /> Calendrier éditorial
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Drag & drop pour replanifier · Clic pour éditer · Sélectionne une plage pour créer.
        </p>
      </div>

      <CalendarToolbar />

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">Chargement…</CardContent>
        </Card>
      ) : (
        <CalendarView />
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-center text-muted-foreground">Chargement…</div>}>
      <CalendarPageInner />
    </React.Suspense>
  );
}
