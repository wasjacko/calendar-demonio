"use client";

import { TrendingUp } from "lucide-react";
import { EightWeekGrid } from "@/components/strategy/eight-week-grid";
import { FunnelCoach } from "@/components/strategy/funnel-coach";
import { useDataStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";

export default function StrategyPage() {
  const loading = useDataStore((s) => s.loading);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="size-6" /> Stratégie d&apos;acquisition · 8 semaines
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vision long-terme de ton funnel Instagram → SKOOL. TOFU pour attirer, MOFU pour engager, BOFU pour convertir.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">Chargement…</CardContent>
        </Card>
      ) : (
        <>
          <FunnelCoach />
          <EightWeekGrid />
        </>
      )}
    </div>
  );
}
