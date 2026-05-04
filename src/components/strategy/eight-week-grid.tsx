"use client";

import * as React from "react";
import { TrendingUp, Target, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn, addWeeks, startOfWeek, getWeekNumber, formatDate, isSameDay } from "@/lib/utils";
import { FUNNEL_STAGES, FORMATS, type Post, type FunnelStage } from "@/lib/types";

const TOTAL_WEEKS = 8;
const TARGET_PER_WEEK = 7;

export function EightWeekGrid() {
  const { posts } = useDataStore();
  const { openEditor } = useUIStore();

  const weeks = React.useMemo(() => {
    const start = startOfWeek(new Date());
    return Array.from({ length: TOTAL_WEEKS }, (_, i) => {
      const weekStart = addWeeks(start, i);
      const weekEnd = addWeeks(weekStart, 1);
      const weekPosts = posts.filter((p) => {
        if (!p.scheduled_for) return false;
        const d = new Date(p.scheduled_for);
        return d >= weekStart && d < weekEnd;
      });
      return {
        index: i,
        start: weekStart,
        end: weekEnd,
        weekNumber: getWeekNumber(weekStart),
        posts: weekPosts,
      };
    });
  }, [posts]);

  const totalScheduled = weeks.reduce((acc, w) => acc + w.posts.length, 0);
  const totalTarget = TOTAL_WEEKS * TARGET_PER_WEEK;
  const completionPct = Math.round((totalScheduled / totalTarget) * 100);

  const funnelTotals = React.useMemo(() => {
    const allPosts = weeks.flatMap((w) => w.posts);
    return {
      TOFU: allPosts.filter((p) => p.funnel_stage === "TOFU").length,
      MOFU: allPosts.filter((p) => p.funnel_stage === "MOFU").length,
      BOFU: allPosts.filter((p) => p.funnel_stage === "BOFU").length,
    };
  }, [weeks]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5" /> Vue stratégique sur 8 semaines
              </CardTitle>
              <CardDescription>
                {formatDate(weeks[0].start)} → {formatDate(weeks[TOTAL_WEEKS - 1].end)}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {totalScheduled}<span className="text-muted-foreground text-sm font-normal">/{totalTarget}</span>
              </p>
              <p className="text-xs text-muted-foreground">posts planifiés</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completionPct} className="h-2" indicatorClassName="gradient-brand" />
          <div className="grid grid-cols-3 gap-3 mt-4">
            <FunnelStat stage="TOFU" count={funnelTotals.TOFU} target={Math.round(totalTarget * FUNNEL_STAGES.TOFU.ratio)} />
            <FunnelStat stage="MOFU" count={funnelTotals.MOFU} target={Math.round(totalTarget * FUNNEL_STAGES.MOFU.ratio)} />
            <FunnelStat stage="BOFU" count={funnelTotals.BOFU} target={Math.round(totalTarget * FUNNEL_STAGES.BOFU.ratio)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {weeks.map((week) => (
          <WeekCard key={week.index} week={week} target={TARGET_PER_WEEK} onAdd={(date) => openEditor(null, date.toISOString())} onEdit={(id) => openEditor(id)} />
        ))}
      </div>
    </div>
  );
}

function FunnelStat({ stage, count, target }: { stage: FunnelStage; count: number; target: number }) {
  const pct = target === 0 ? 0 : Math.min(100, Math.round((count / target) * 100));
  const isOnTrack = pct >= 80;
  return (
    <div className="rounded-lg border border-border p-3 bg-card">
      <div className="flex items-center justify-between mb-2">
        <Badge variant={stage.toLowerCase() as never}>{stage}</Badge>
        {isOnTrack ? <CheckCircle2 className="size-4 text-status-published" /> : <AlertCircle className="size-4 text-muted-foreground" />}
      </div>
      <p className="text-xl font-bold">
        {count}<span className="text-xs text-muted-foreground font-normal">/{target}</span>
      </p>
      <p className="text-xs text-muted-foreground">{FUNNEL_STAGES[stage].label}</p>
      <Progress
        value={pct}
        className="h-1.5 mt-2"
        indicatorClassName={`bg-${FUNNEL_STAGES[stage].color}`}
      />
    </div>
  );
}

interface WeekData {
  index: number;
  start: Date;
  end: Date;
  weekNumber: number;
  posts: Post[];
}

function WeekCard({ week, target, onAdd, onEdit }: {
  week: WeekData;
  target: number;
  onAdd: (date: Date) => void;
  onEdit: (id: string) => void;
}) {
  const tofu = week.posts.filter((p) => p.funnel_stage === "TOFU").length;
  const mofu = week.posts.filter((p) => p.funnel_stage === "MOFU").length;
  const bofu = week.posts.filter((p) => p.funnel_stage === "BOFU").length;
  const isCurrent = isSameDay(startOfWeek(new Date()), week.start);
  const completionPct = Math.min(100, Math.round((week.posts.length / target) * 100));

  return (
    <Card className={cn("relative overflow-hidden", isCurrent && "ring-2 ring-primary")}>
      {isCurrent && (
        <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-bl-md">
          ACTUEL
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Semaine {week.weekNumber}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {week.start.getDate()}/{week.start.getMonth() + 1}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress
          value={completionPct}
          className="h-1.5"
          indicatorClassName={completionPct >= 100 ? "bg-status-published" : completionPct >= 60 ? "bg-tofu" : "bg-status-draft"}
        />

        <div className="flex gap-1.5">
          <FunnelDot count={tofu} stage="TOFU" />
          <FunnelDot count={mofu} stage="MOFU" />
          <FunnelDot count={bofu} stage="BOFU" />
        </div>

        <div className="space-y-1 max-h-40 overflow-y-auto">
          {week.posts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">Aucun post planifié</p>
          ) : (
            week.posts.map((p) => (
              <button
                key={p.id}
                onClick={() => onEdit(p.id)}
                className="w-full text-left text-xs p-1.5 rounded hover:bg-accent flex items-center gap-1.5 group"
              >
                <span className={cn("size-1.5 rounded-full bg-", FUNNEL_STAGES[p.funnel_stage].color)} />
                <span className="shrink-0">{FORMATS[p.format].emoji}</span>
                <span className="truncate flex-1">{p.title}</span>
              </button>
            ))
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs h-7"
          onClick={() => onAdd(week.start)}
        >
          <Plus className="size-3" /> Ajouter
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          {week.posts.length}/{target} posts · {completionPct}%
        </p>
      </CardContent>
    </Card>
  );
}

function FunnelDot({ count, stage }: { count: number; stage: FunnelStage }) {
  return (
    <div
      className={cn(
        "flex-1 h-7 rounded flex items-center justify-center text-[10px] font-bold",
        count > 0 ? `bg-${FUNNEL_STAGES[stage].color} text-white` : "bg-muted text-muted-foreground"
      )}
    >
      {stage}: {count}
    </div>
  );
}
