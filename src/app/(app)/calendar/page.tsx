"use client";

import * as React from "react";
import {
  Inbox,
  CalendarDays,
  CircleCheck,
  Layers,
  CircleDashed,
  Circle,
  Clock,
} from "lucide-react";
import { useDataStore } from "@/lib/store";
import { useCurrentSalve } from "@/lib/use-current-salve";
import {
  CONTENT_TYPES,
  FORMATS,
  SALVE_STAGES,
  WEEK_SLOTS_ORDER,
  type ContentType,
  type ContentFormat,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export default function KpiPage() {
  const { posts, loading } = useDataStore();
  const current = useCurrentSalve();

  const stats = React.useMemo(() => {
    // Catégories mutuellement exclusives
    const total = posts.length;
    const pool = posts.filter((p) => !p.week_slot && !p.legion_number);
    const planned = posts.filter((p) => p.legion_number); // assignées à une Salve

    // Sanity check: pool + planned = total (les posts ont soit l'un soit l'autre)
    const orphans = total - pool.length - planned.length; // devrait être 0

    // États de production (uniquement sur les posts assignés)
    const todo = planned.filter((p) => p.inspi_status === "TODO");
    const doing = planned.filter((p) => p.inspi_status === "DOING");
    const done = planned.filter((p) => p.inspi_status === "DONE");
    const noState = planned.filter((p) => !p.inspi_status);
    // todo + doing + done + noState = planned.length

    // Cycle en cours (Salve actuelle d'après useCurrentSalve)
    const inCurrentSalve = planned.filter(
      (p) => p.legion_number === current.legion
    );
    // Un cycle complet = 3 semaines × 5 slots = 15 posts
    const currentSalveCapacity = 15;
    const currentSalveDone = inCurrentSalve.filter(
      (p) => p.inspi_status === "DONE"
    ).length;

    // Par sous-Salve (semaine 1/2/3) du cycle courant
    const bySemaine = ([1, 2, 3] as const).map((s) => {
      const items = inCurrentSalve.filter((p) => p.salve_number === s);
      return {
        salve: s,
        stage: SALVE_STAGES[s],
        filled: items.length,
        done: items.filter((p) => p.inspi_status === "DONE").length,
        capacity: WEEK_SLOTS_ORDER.length, // 5 slots
      };
    });

    // Répartition par type de Reel — calculée sur posts ayant un type défini
    const typed = posts.filter((p) => p.content_type);
    const byType = {} as Record<ContentType, number>;
    (Object.keys(CONTENT_TYPES) as ContentType[]).forEach((c) => {
      byType[c] = typed.filter((p) => p.content_type === c).length;
    });
    const untyped = total - typed.length;

    // Répartition par format de publication (Reel/Post/Carousel...)
    const byFormat = {} as Record<ContentFormat, number>;
    (Object.keys(FORMATS) as ContentFormat[]).forEach((f) => {
      byFormat[f] = posts.filter((p) => p.format === f).length;
    });

    // Activité récente (5 plus récentes)
    const recent = [...posts]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);

    return {
      total,
      pool,
      planned,
      orphans,
      todo,
      doing,
      done,
      noState,
      inCurrentSalve,
      currentSalveCapacity,
      currentSalveDone,
      bySemaine,
      byType,
      typed,
      untyped,
      byFormat,
      recent,
    };
  }, [posts, current.legion]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-12 max-w-3xl mx-auto">
        <p className="text-center text-sm text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-10 max-w-3xl mx-auto space-y-6">
      {/* Vue d'ensemble — 4 KPI cards mutuellement cohérents */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total" value={stats.total} icon={Layers} />
        <KpiCard
          label="Pool"
          value={stats.pool.length}
          icon={Inbox}
          tone="muted"
          hint="Non assignées"
        />
        <KpiCard
          label="Planifiées"
          value={stats.planned.length}
          icon={CalendarDays}
          tone="amber"
          hint="Dans une Salve"
        />
        <KpiCard
          label="Faites"
          value={stats.done.length}
          icon={CircleCheck}
          tone="emerald"
          hint={
            stats.planned.length > 0
              ? `${Math.round((stats.done.length / stats.planned.length) * 100)}% des planifiées`
              : "—"
          }
        />
      </div>

      {/* Cycle en cours — Salve N courante */}
      <Section
        title={`Salve ${current.legion} en cours`}
        subtitle={`${stats.inCurrentSalve.length}/${stats.currentSalveCapacity} créneaux remplis · ${stats.currentSalveDone} faits`}
      >
        <div className="space-y-3">
          {stats.bySemaine.map((sem) => {
            const filledPct = (sem.filled / sem.capacity) * 100;
            const donePct = (sem.done / sem.capacity) * 100;
            const isHighlighted = sem.salve === current.salve;
            return (
              <div key={sem.salve} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    {isHighlighted && (
                      <span className="size-1.5 rounded-full bg-foreground animate-pulse" />
                    )}
                    <span className="font-semibold">Semaine {sem.salve}</span>
                    <span className="text-muted-foreground">
                      — {sem.stage.name}
                    </span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {sem.done}/{sem.filled}/{sem.capacity}{" "}
                    <span className="text-[10px]">faits/remplis/total</span>
                  </span>
                </div>
                {/* Double barre: remplissage clair + done foncé */}
                <div className="h-2 rounded-full bg-muted overflow-hidden relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-foreground/20 transition-all"
                    style={{ width: `${filledPct}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500 transition-all"
                    style={{ width: `${donePct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* État de production — uniquement sur les posts planifiés */}
      <Section
        title="État de production"
        subtitle={
          stats.planned.length > 0
            ? `Sur ${stats.planned.length} post${stats.planned.length > 1 ? "s" : ""} planifié${stats.planned.length > 1 ? "s" : ""}`
            : "Aucun post planifié"
        }
      >
        {stats.planned.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Va dans Salve pour planifier tes premiers posts.
          </p>
        ) : (
          <div className="space-y-2.5">
            <StatRow
              icon={Circle}
              label="À faire"
              count={stats.todo.length}
              total={stats.planned.length}
              color="bg-sky-500"
            />
            <StatRow
              icon={CircleDashed}
              label="En cours"
              count={stats.doing.length}
              total={stats.planned.length}
              color="bg-amber-500"
            />
            <StatRow
              icon={CircleCheck}
              label="Fait"
              count={stats.done.length}
              total={stats.planned.length}
              color="bg-emerald-500"
            />
            {stats.noState.length > 0 && (
              <StatRow
                icon={Clock}
                label="Sans état"
                count={stats.noState.length}
                total={stats.planned.length}
                color="bg-muted-foreground/40"
              />
            )}
          </div>
        )}
      </Section>

      {/* Répartition par type de Reel */}
      <Section
        title="Types de Reel"
        subtitle={
          stats.typed.length > 0
            ? `${stats.typed.length} catégorisée${stats.typed.length > 1 ? "s" : ""}${stats.untyped > 0 ? ` · ${stats.untyped} sans type` : ""}`
            : "Aucun post catégorisé"
        }
      >
        {stats.typed.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Catégorise tes vidéos pour voir la répartition.
          </p>
        ) : (
          <div className="space-y-2.5">
            {(Object.keys(CONTENT_TYPES) as ContentType[])
              .map((c) => ({
                type: c,
                count: stats.byType[c],
              }))
              .filter((x) => x.count > 0)
              .sort((a, b) => b.count - a.count)
              .map(({ type, count }) => (
                <BreakdownRow
                  key={type}
                  label={CONTENT_TYPES[type].label}
                  color={CONTENT_TYPES[type].color}
                  count={count}
                  total={stats.typed.length}
                />
              ))}
          </div>
        )}
      </Section>

      {/* Répartition par format (Reel/Post/Carousel...) — affiché seulement
          si plus d'un format présent */}
      {Object.values(stats.byFormat).filter((v) => v > 0).length > 1 && (
        <Section
          title="Formats de publication"
          subtitle={`Sur ${stats.total} post${stats.total > 1 ? "s" : ""}`}
        >
          <div className="space-y-2.5">
            {(Object.keys(FORMATS) as ContentFormat[])
              .filter((f) => stats.byFormat[f] > 0)
              .sort((a, b) => stats.byFormat[b] - stats.byFormat[a])
              .map((f) => (
                <BreakdownRow
                  key={f}
                  label={FORMATS[f].label}
                  color="muted-foreground"
                  count={stats.byFormat[f]}
                  total={stats.total}
                />
              ))}
          </div>
        </Section>
      )}

      {/* Activité récente */}
      {stats.recent.length > 0 && (
        <Section title="Activité récente" subtitle="5 dernières ajoutées">
          <div className="space-y-1">
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
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      {typeInfo && (
                        <span
                          className={`size-1.5 rounded-full bg-${typeInfo.color}`}
                        />
                      )}
                      <span>
                        {typeInfo?.label ?? "Sans type"} ·{" "}
                        {new Date(post.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Sanity check pour debug — affiché seulement si orphelin détecté */}
      {stats.orphans !== 0 && (
        <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg">
          ⚠ {stats.orphans} post{Math.abs(stats.orphans) > 1 ? "s" : ""}{" "}
          orphelin{Math.abs(stats.orphans) > 1 ? "s" : ""} détecté
          {Math.abs(stats.orphans) > 1 ? "s" : ""} — état incohérent.
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
      <div className="px-1">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {title}
        </p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "muted" | "amber" | "emerald";
  hint?: string;
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
        "rounded-2xl border border-border p-3 sm:p-4 shadow-sm flex flex-col",
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
      {hint && (
        <p className="text-[10px] text-muted-foreground mt-auto pt-1 line-clamp-1">
          {hint}
        </p>
      )}
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  count,
  total,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  total: number;
  color: string;
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
          {count}{" "}
          <span className="text-[10px] text-muted-foreground/70">({pct}%)</span>
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

function BreakdownRow({
  label,
  color,
  count,
  total,
}: {
  label: string;
  color: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <span className={cn("size-1.5 rounded-full", `bg-${color}`)} />
          {label}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {count}{" "}
          <span className="text-[10px] text-muted-foreground/70">
            ({Math.round(pct)}%)
          </span>
        </span>
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
