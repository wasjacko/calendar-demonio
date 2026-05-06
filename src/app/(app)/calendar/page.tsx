"use client";

import * as React from "react";
import {
  Inbox,
  CalendarDays,
  CircleCheck,
  TrendingUp,
  CircleDashed,
  Circle,
} from "lucide-react";
import { useDataStore } from "@/lib/store";
import {
  CONTENT_TYPES,
  FORMATS,
  type ContentType,
  type ContentFormat,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export default function KpiPage() {
  const { posts, loading } = useDataStore();

  const stats = React.useMemo(() => {
    const total = posts.length;
    const inPool = posts.filter((p) => !p.week_slot && !p.legion_number).length;
    const scheduled = posts.filter(
      (p) => p.legion_number && p.inspi_status !== "DONE"
    ).length;
    const done = posts.filter((p) => p.inspi_status === "DONE").length;

    // Inspi status breakdown (parmi les posts assignés)
    const assignedPosts = posts.filter((p) => p.legion_number);
    const inspiCounts = {
      TODO: assignedPosts.filter((p) => p.inspi_status === "TODO").length,
      DOING: assignedPosts.filter((p) => p.inspi_status === "DOING").length,
      DONE: assignedPosts.filter((p) => p.inspi_status === "DONE").length,
      NONE: assignedPosts.filter((p) => !p.inspi_status).length,
    };

    // Alter breakdown
    const byCategory = {} as Record<ContentType, number>;
    (Object.keys(CONTENT_TYPES) as ContentType[]).forEach((c) => {
      byCategory[c] = posts.filter((p) => p.content_type === c).length;
    });
    const uncategorized = posts.filter((p) => !p.content_type).length;

    // Format breakdown
    const byFormat = {} as Record<ContentFormat, number>;
    (Object.keys(FORMATS) as ContentFormat[]).forEach((f) => {
      byFormat[f] = posts.filter((p) => p.format === f).length;
    });

    // Activité récente
    const recent = [...posts]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);

    return {
      total,
      inPool,
      scheduled,
      done,
      inspiCounts,
      byCategory,
      uncategorized,
      byFormat,
      recent,
    };
  }, [posts]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-12 max-w-3xl mx-auto">
        <p className="text-center text-sm text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  const maxCat = Math.max(...Object.values(stats.byCategory), 1);
  const maxFormat = Math.max(...Object.values(stats.byFormat), 1);

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-10 max-w-3xl mx-auto space-y-6">
      {/* KPI cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Total"
          value={stats.total}
          icon={TrendingUp}
        />
        <KpiCard
          label="Pool"
          value={stats.inPool}
          icon={Inbox}
          tone="muted"
        />
        <KpiCard
          label="Programmées"
          value={stats.scheduled}
          icon={CalendarDays}
          tone="amber"
        />
        <KpiCard
          label="Faites"
          value={stats.done}
          icon={CircleCheck}
          tone="emerald"
        />
      </div>

      {/* État production */}
      <Section title="État de production">
        <div className="space-y-2.5">
          <StatRow
            icon={Circle}
            label="À faire"
            count={stats.inspiCounts.TODO}
            color="bg-sky-500"
            total={stats.scheduled + stats.done}
          />
          <StatRow
            icon={CircleDashed}
            label="En cours"
            count={stats.inspiCounts.DOING}
            color="bg-amber-500"
            total={stats.scheduled + stats.done}
          />
          <StatRow
            icon={CircleCheck}
            label="Fait"
            count={stats.inspiCounts.DONE}
            color="bg-emerald-500"
            total={stats.scheduled + stats.done}
          />
          {stats.inspiCounts.NONE > 0 && (
            <p className="text-[11px] text-muted-foreground pt-1">
              {stats.inspiCounts.NONE} assignée
              {stats.inspiCounts.NONE > 1 ? "s" : ""} sans état
            </p>
          )}
        </div>
      </Section>

      {/* Répartition par catégorie */}
      <Section title="Alters">
        <div className="space-y-2.5">
          {(Object.keys(CONTENT_TYPES) as ContentType[]).map((c) => (
            <CategoryRow
              key={c}
              label={CONTENT_TYPES[c].label}
              color={CONTENT_TYPES[c].color}
              count={stats.byCategory[c]}
              max={maxCat}
            />
          ))}
          {stats.uncategorized > 0 && (
            <p className="text-[11px] text-muted-foreground pt-1">
              {stats.uncategorized} sans catégorie
            </p>
          )}
        </div>
      </Section>

      {/* Répartition par format */}
      <Section title="Formats">
        <div className="space-y-2.5">
          {(Object.keys(FORMATS) as ContentFormat[])
            .filter((f) => stats.byFormat[f] > 0)
            .map((f) => (
              <CategoryRow
                key={f}
                label={FORMATS[f].label}
                color="muted-foreground"
                count={stats.byFormat[f]}
                max={maxFormat}
              />
            ))}
        </div>
      </Section>

      {/* Activité récente */}
      {stats.recent.length > 0 && (
        <Section title="Activité récente">
          <div className="space-y-1.5">
            {stats.recent.map((post) => {
              const typeInfo = post.content_type
                ? CONTENT_TYPES[post.content_type]
                : null;
              return (
                <div
                  key={post.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  {post.visual_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.visual_url}
                      alt=""
                      className="size-10 rounded-lg object-cover shrink-0 bg-muted"
                      onError={(e) =>
                        ((e.currentTarget as HTMLImageElement).style.display =
                          "none")
                      }
                    />
                  ) : (
                    <div className="size-10 rounded-lg bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      {post.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {typeInfo?.label ?? "—"} ·{" "}
                      {new Date(post.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-1">
        {title}
      </p>
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "muted" | "amber" | "emerald";
}) {
  const toneStyles = {
    default: "bg-card",
    muted: "bg-muted/40",
    amber: "bg-amber-50 border-amber-200",
    emerald: "bg-emerald-50 border-emerald-200",
  } as const;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border p-3 sm:p-4 shadow-sm",
        toneStyles[tone]
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </p>
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <p className="text-2xl sm:text-3xl font-bold tabular-nums mt-1">
        {value}
      </p>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  count,
  color,
  total,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  color: string;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <Icon className="size-3.5 text-muted-foreground" />
          {label}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {count} <span className="text-[10px]">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CategoryRow({
  label,
  color,
  count,
  max,
}: {
  label: string;
  color: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <span className={cn("size-1.5 rounded-full", `bg-${color}`)} />
          {label}
        </span>
        <span className="tabular-nums text-muted-foreground">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", `bg-${color}`)}
          style={{ width: `${pct}%`, opacity: count > 0 ? 1 : 0 }}
        />
      </div>
    </div>
  );
}
