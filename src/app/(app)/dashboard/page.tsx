"use client";

import * as React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  CalendarClock,
  Sparkles,
  ArrowUpRight,
  Target,
  Clock,
  Plus,
} from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import type { Post } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FUNNEL_STAGES, FORMATS, STATUSES } from "@/lib/types";
import { addDays, formatRelative, isSameDay, startOfWeek } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { posts, loading } = useDataStore();
  const { openEditor } = useUIStore();

  const stats = React.useMemo(() => computeStats(posts), [posts]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="size-6" /> Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vue rapide de ton acquisition Instagram → SKOOL
          </p>
        </div>
        <Button variant="gradient" onClick={() => openEditor()}>
          <Plus className="size-4" /> Nouveau post
        </Button>
      </div>

      {loading ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Chargement…</CardContent></Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Cette semaine"
              value={stats.thisWeek}
              total={7}
              icon={CalendarClock}
              hint={`${stats.scheduledThisWeek} programmés · ${stats.publishedThisWeek} publiés`}
            />
            <KpiCard
              label="Taux funnel BOFU"
              value={stats.bofuRatio}
              suffix="%"
              icon={Target}
              hint="Idéal entre 8% et 15%"
              color={stats.bofuRatio >= 8 && stats.bofuRatio <= 15 ? "status-published" : "status-draft"}
            />
            <KpiCard
              label="8 sem couvertes"
              value={stats.eightWeekCovered}
              total={56}
              icon={TrendingUp}
              hint={`${Math.round((stats.eightWeekCovered / 56) * 100)}% du plan`}
            />
            <KpiCard
              label="Brouillons"
              value={stats.drafts}
              icon={Clock}
              hint="À finaliser cette semaine"
              color={stats.drafts > 5 ? "status-draft" : undefined}
            />
          </div>

          {/* Funnel breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution funnel — 30 prochains jours</CardTitle>
              <CardDescription>Ratio idéal : 60% TOFU · 30% MOFU · 10% BOFU</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FunnelBar stage="TOFU" count={stats.funnel30.TOFU} total={stats.funnel30.total} />
              <FunnelBar stage="MOFU" count={stats.funnel30.MOFU} total={stats.funnel30.total} />
              <FunnelBar stage="BOFU" count={stats.funnel30.BOFU} total={stats.funnel30.total} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Today + Upcoming */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>À venir cette semaine</CardTitle>
                  <CardDescription>{stats.upcoming.length} post{stats.upcoming.length > 1 ? "s" : ""} programmé{stats.upcoming.length > 1 ? "s" : ""}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/calendar">Voir tout <ArrowUpRight className="size-3.5" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Rien de prévu. Crée ton premier post 🚀</p>
                ) : (
                  stats.upcoming.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => openEditor(p.id)}
                      className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                    >
                      <span className="size-8 rounded-md flex items-center justify-center text-base bg-muted shrink-0">
                        {FORMATS[p.format].emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelative(p.scheduled_for!)} · {STATUSES[p.status].label}
                        </p>
                      </div>
                      <Badge variant={p.funnel_stage.toLowerCase() as never} className="shrink-0 text-[10px]">{p.funnel_stage}</Badge>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
                <CardDescription>Pour avancer ton funnel maintenant</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <QuickAction
                  icon={Sparkles}
                  label="Idée Reel TOFU"
                  hint="Hook viral, B-roll"
                  onClick={() => openEditor()}
                  color="tofu"
                />
                <QuickAction
                  icon={Sparkles}
                  label="Carrousel MOFU"
                  hint="Éducation profonde"
                  onClick={() => openEditor()}
                  color="mofu"
                />
                <QuickAction
                  icon={Sparkles}
                  label="Témoignage BOFU"
                  hint="Conversion SKOOL"
                  onClick={() => openEditor()}
                  color="bofu"
                />
                <QuickAction
                  icon={CalendarClock}
                  label="Voir 8 semaines"
                  hint="Vue stratégique"
                  href="/strategy"
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  total,
  suffix,
  icon: Icon,
  hint,
  color = "primary",
}: {
  label: string;
  value: number;
  total?: number;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className={cn("size-4", `text-${color}`)} />
        </div>
        <p className="text-2xl font-bold">
          {value}{suffix}
          {total !== undefined && <span className="text-sm text-muted-foreground font-normal">/{total}</span>}
        </p>
        {hint && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function FunnelBar({ stage, count, total }: { stage: keyof typeof FUNNEL_STAGES; count: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  const target = Math.round(FUNNEL_STAGES[stage].ratio * 100);
  const isOnTarget = Math.abs(pct - target) <= 10;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Badge variant={stage.toLowerCase() as never}>{stage}</Badge>
          <span className="text-sm font-medium">{FUNNEL_STAGES[stage].label}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">{count}</span>
          <span className="text-muted-foreground">/{total}</span>
          <Badge variant={isOnTarget ? "published" : "outline"} className="text-[10px]">
            {pct}% (cible {target}%)
          </Badge>
        </div>
      </div>
      <Progress value={pct} className="h-2" indicatorClassName={`bg-${FUNNEL_STAGES[stage].color}`} />
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  hint,
  onClick,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  onClick?: () => void;
  href?: string;
  color?: string;
}) {
  const inner = (
    <div className={cn(
      "p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left h-full",
      color && `border-${color}/30`
    )}>
      <Icon className={cn("size-4 mb-1.5", color ? `text-${color}` : "text-primary")} />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return <button onClick={onClick} className="w-full">{inner}</button>;
}

function computeStats(posts: Post[]) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const horizon30 = addDays(now, 30);
  const horizon8w = addDays(now, 56);

  const thisWeekPosts = posts.filter((p) => p.scheduled_for && new Date(p.scheduled_for) >= weekStart && new Date(p.scheduled_for) < weekEnd);
  const upcoming = posts
    .filter((p) => p.scheduled_for && new Date(p.scheduled_for) >= now && p.status !== "PUBLISHED" && p.status !== "MISSED")
    .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime());

  const next30 = posts.filter((p) => p.scheduled_for && new Date(p.scheduled_for) >= now && new Date(p.scheduled_for) < horizon30);
  const next30Total = next30.length;

  const eightWeekCovered = posts.filter((p) => p.scheduled_for && new Date(p.scheduled_for) >= now && new Date(p.scheduled_for) < horizon8w).length;

  return {
    thisWeek: thisWeekPosts.length,
    scheduledThisWeek: thisWeekPosts.filter((p) => p.status === "SCHEDULED").length,
    publishedThisWeek: thisWeekPosts.filter((p) => p.status === "PUBLISHED").length,
    drafts: posts.filter((p) => p.status === "DRAFT").length,
    eightWeekCovered,
    bofuRatio: next30Total === 0 ? 0 : Math.round((next30.filter((p) => p.funnel_stage === "BOFU").length / next30Total) * 100),
    funnel30: {
      TOFU: next30.filter((p) => p.funnel_stage === "TOFU").length,
      MOFU: next30.filter((p) => p.funnel_stage === "MOFU").length,
      BOFU: next30.filter((p) => p.funnel_stage === "BOFU").length,
      total: next30Total,
    },
    upcoming,
  };
}
