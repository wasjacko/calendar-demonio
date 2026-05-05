"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Calendar as CalendarIcon,
  Link as LinkIcon,
  ChevronDown,
} from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { useCurrentSalve } from "@/lib/use-current-salve";
import {
  CONTENT_TYPES,
  FORMATS,
  STATUSES,
  type ContentType,
  type Post,
} from "@/lib/types";
import { formatRelative, cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardPage() {
  const { posts, loading } = useDataStore();
  const { openEditor } = useUIStore();
  const current = useCurrentSalve();

  const stats = React.useMemo(() => computeStats(posts), [posts]);

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-7 max-w-3xl mx-auto space-y-7 sm:space-y-9">
      {/* Salve courante (manuelle) */}
      <SalveSelector current={current} />

      {/* Hero : drop URL */}
      <button
        onClick={() => openEditor()}
        className="w-full text-left group"
      >
        <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-colors flex items-center gap-4">
          <div className="size-12 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-md">
            <LinkIcon className="size-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base">Ajouter une vidéo</p>
            <p className="text-sm text-muted-foreground">Colle un lien Instagram pour commencer</p>
          </div>
          <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>
      </button>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-12">Chargement…</p>
      ) : (
        <>
          {/* KPIs en row plate (pas de cards) */}
          <section>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
              Vue d&apos;ensemble
            </p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <Kpi label="Publiés" value={stats.published} />
              <Kpi label="Vues" value={stats.totalViews} />
              <Kpi label="Engmt" value={stats.totalEngagement} />
              <Kpi label="Brouillons" value={stats.drafts} />
            </div>
          </section>

          {/* Catégories — liste plate */}
          <section>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
              Par catégorie
            </p>
            <div className="space-y-px rounded-xl border border-border overflow-hidden">
              {(Object.keys(CONTENT_TYPES) as ContentType[]).map((t) => (
                <div key={t} className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-accent/30 transition-colors">
                  <span className={`size-2.5 rounded-full bg-${CONTENT_TYPES[t].color}`} />
                  <span className="text-sm flex-1">{CONTENT_TYPES[t].label}</span>
                  <span className="text-base font-semibold tabular-nums">{stats.byType[t]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* À venir */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">À venir</p>
              <Link href="/calendar" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5">
                Voir tout <ArrowUpRight className="size-3" />
              </Link>
            </div>
            {stats.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Aucun post programmé.</p>
            ) : (
              <div className="space-y-px rounded-xl border border-border overflow-hidden">
                {stats.upcoming.slice(0, 5).map((p) => (
                  <PostRow key={p.id} post={p} onClick={() => openEditor(p.id)} />
                ))}
              </div>
            )}
          </section>

          {/* Résultats récents */}
          <section>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Résultats récents</p>
            {stats.recentPublished.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Pas encore de posts publiés avec métriques.</p>
            ) : (
              <div className="space-y-px rounded-xl border border-border overflow-hidden">
                {stats.recentPublished.slice(0, 5).map((p) => (
                  <ResultRow key={p.id} post={p} onClick={() => openEditor(p.id)} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SalveSelector({ current }: { current: ReturnType<typeof useCurrentSalve> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 -ml-1 px-3 py-2 rounded-lg hover:bg-accent transition-colors group">
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Salve courante</p>
            <p className="text-sm font-semibold tracking-tight">Légion {current.legion} · Salve {current.salve}</p>
          </div>
          <ChevronDown className="size-4 text-muted-foreground group-hover:text-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide">Salve</DropdownMenuLabel>
        {([1, 2, 3] as const).map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => current.setCurrent({ legion: current.legion, salve: s })}
            className={current.salve === s ? "bg-accent font-medium" : ""}
          >
            Salve {s}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide">Légion</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => current.setCurrent({ legion: Math.max(1, current.legion - 1), salve: current.salve })}>
          ← Précédente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => current.setCurrent({ legion: current.legion + 1, salve: current.salve })}>
          Suivante →
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">{formatNumber(value)}</p>
      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium mt-0.5">{label}</p>
    </div>
  );
}

function PostRow({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <div className="w-full flex items-center gap-3 px-3 py-2.5 bg-card hover:bg-accent/30 transition-colors group">
      <button onClick={onClick} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        {post.visual_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.visual_url} alt="" className="size-10 rounded-md object-cover shrink-0" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
        ) : (
          <div className={cn(
            "size-10 rounded-md flex items-center justify-center shrink-0 text-[10px] font-semibold",
            post.content_type ? `bg-${CONTENT_TYPES[post.content_type].color}/15 text-${CONTENT_TYPES[post.content_type].color}` : "bg-muted text-muted-foreground"
          )}>
            {FORMATS[post.format].label.slice(0, 4)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{post.title}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <CalendarIcon className="size-3" />
            <span>{post.scheduled_for ? formatRelative(post.scheduled_for) : "Non planifié"}</span>
            <span className="opacity-50">·</span>
            <span>{STATUSES[post.status].label}</span>
          </p>
        </div>
        {post.content_type && (
          <Badge variant={post.content_type.toLowerCase() as never} className="shrink-0 text-[10px] hidden sm:inline-flex">
            {CONTENT_TYPES[post.content_type].label}
          </Badge>
        )}
      </button>
      {post.source_url && (
        <CopyButton
          value={post.source_url}
          className="shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        />
      )}
    </div>
  );
}

function ResultRow({ post, onClick }: { post: Post; onClick: () => void }) {
  const perf = post.performance ?? {};
  return (
    <div className="w-full flex items-center gap-3 px-3 py-2.5 bg-card hover:bg-accent/30 transition-colors group">
      <button onClick={onClick} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        {post.visual_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.visual_url} alt="" className="size-10 rounded-md object-cover shrink-0" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
        ) : (
          <div className="size-10 rounded-md flex items-center justify-center bg-muted text-muted-foreground shrink-0 text-[10px] font-semibold">
            {FORMATS[post.format].label.slice(0, 4)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{post.title}</p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
            {perf.views !== undefined && <span className="flex items-center gap-0.5"><Eye className="size-3" /> {formatNumber(perf.views)}</span>}
            {perf.likes !== undefined && <span className="flex items-center gap-0.5"><Heart className="size-3" /> {formatNumber(perf.likes)}</span>}
            {perf.comments !== undefined && <span className="flex items-center gap-0.5"><MessageCircle className="size-3" /> {formatNumber(perf.comments)}</span>}
            {perf.saves !== undefined && <span className="flex items-center gap-0.5"><Bookmark className="size-3" /> {formatNumber(perf.saves)}</span>}
          </div>
        </div>
      </button>
      {post.source_url && (
        <CopyButton
          value={post.source_url}
          className="shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        />
      )}
    </div>
  );
}

function formatNumber(n: number | undefined): string {
  if (n === undefined || n === 0) return "0";
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 1 : 0) + "k";
  return (n / 1_000_000).toFixed(1) + "M";
}

function computeStats(posts: Post[]) {
  const now = new Date();

  const upcoming = posts
    .filter((p) => p.scheduled_for && new Date(p.scheduled_for) >= now && p.status !== "PUBLISHED" && p.status !== "MISSED")
    .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime());

  const recentPublished = posts
    .filter((p) => p.status === "PUBLISHED")
    .sort((a, b) => {
      const aTime = a.published_at ?? a.scheduled_for ?? "";
      const bTime = b.published_at ?? b.scheduled_for ?? "";
      return bTime.localeCompare(aTime);
    });

  const totalViews = posts.reduce((sum, p) => sum + (p.performance?.views ?? 0), 0);
  const totalEngagement = posts.reduce((sum, p) => {
    const perf = p.performance ?? {};
    return sum + (perf.likes ?? 0) + (perf.comments ?? 0) + (perf.saves ?? 0);
  }, 0);

  const byType: Record<ContentType, number> = {
    EXPERT: 0,
    AUDIENCE: 0,
    ATTACHEMENT: 0,
    VALEUR: 0,
  };
  posts.forEach((p) => {
    if (p.content_type) byType[p.content_type]++;
  });

  return {
    drafts: posts.filter((p) => p.status === "IDEA" || p.status === "DRAFT").length,
    published: posts.filter((p) => p.status === "PUBLISHED").length,
    totalViews,
    totalEngagement,
    upcoming,
    recentPublished,
    byType,
  };
}
