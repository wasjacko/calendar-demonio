"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Plus,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Calendar as CalendarIcon,
  Link as LinkIcon,
  ChevronDown,
} from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Header : juste salve courante + bouton */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <SalveSelector current={current} />
        <Button variant="gradient" onClick={() => openEditor()} className="h-10">
          <Plus className="size-4" /> Nouveau
        </Button>
      </div>

      {loading ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Chargement…</CardContent></Card>
      ) : (
        <>
          {/* Drop URL principal */}
          <button
            onClick={() => openEditor()}
            className="w-full text-left rounded-xl border-2 border-dashed border-border hover:border-primary/50 p-5 transition-colors group bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                <LinkIcon className="size-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Ajouter une vidéo</p>
                <p className="text-xs text-muted-foreground">Colle une URL Instagram</p>
              </div>
              <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-primary" />
            </div>
          </button>

          {/* KPIs principales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Kpi label="Publiés" value={stats.published} />
            <Kpi label="Vues totales" value={stats.totalViews} />
            <Kpi label="Engagement" value={stats.totalEngagement} />
            <Kpi label="Brouillons" value={stats.drafts} />
          </div>

          {/* Vidéos par type */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                Vidéos par catégorie
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(CONTENT_TYPES) as ContentType[]).map((t) => (
                  <div key={t} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`size-2.5 rounded-full bg-${CONTENT_TYPES[t].color}`} />
                      <span className="text-xs font-medium">{CONTENT_TYPES[t].label}</span>
                    </div>
                    <p className="text-xl font-bold mt-1">{stats.byType[t]}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Listes : à venir + résultats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">À venir</p>
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link href="/calendar">Voir tout <ArrowUpRight className="size-3" /></Link>
                  </Button>
                </div>
                <div className="space-y-1">
                  {stats.upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Aucun post programmé.</p>
                  ) : (
                    stats.upcoming.slice(0, 5).map((p) => (
                      <PostRow key={p.id} post={p} onClick={() => openEditor(p.id)} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-3">Résultats récents</p>
                <div className="space-y-1">
                  {stats.recentPublished.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Pas encore de posts publiés avec métriques.
                    </p>
                  ) : (
                    stats.recentPublished.slice(0, 5).map((p) => (
                      <ResultRow key={p.id} post={p} onClick={() => openEditor(p.id)} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function SalveSelector({ current }: { current: ReturnType<typeof useCurrentSalve> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors">
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">En cours</p>
            <p className="text-sm font-semibold">Légion {current.legion} · Salve {current.salve}</p>
          </div>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Salve</DropdownMenuLabel>
        {([1, 2, 3] as const).map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => current.setCurrent({ legion: current.legion, salve: s })}
            className={current.salve === s ? "bg-accent" : ""}
          >
            Salve {s}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Légion</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => current.setCurrent({ legion: Math.max(1, current.legion - 1), salve: current.salve })}>
          Légion précédente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => current.setCurrent({ legion: current.legion + 1, salve: current.salve })}>
          Légion suivante
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
        <p className="text-xl sm:text-2xl font-bold mt-1">{formatNumber(value)}</p>
      </CardContent>
    </Card>
  );
}

function PostRow({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <div className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors group">
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
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="size-3" />
            {post.scheduled_for ? formatRelative(post.scheduled_for) : "Non planifié"}
            <span className="opacity-50">·</span>
            {STATUSES[post.status].label}
          </p>
        </div>
        {post.content_type && (
          <Badge variant={post.content_type.toLowerCase() as never} className="shrink-0 text-[10px]">
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
    <div className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors group">
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
  if (n === undefined) return "—";
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
