"use client";

import * as React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ArrowUpRight,
  Plus,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  TrendingUp,
  Calendar as CalendarIcon,
  Link as LinkIcon,
} from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FUNNEL_STAGES, FORMATS, STATUSES, type Post } from "@/lib/types";
import { formatRelative, cn } from "@/lib/utils";

export default function DashboardPage() {
  const { posts, loading } = useDataStore();
  const { openEditor } = useUIStore();

  const stats = React.useMemo(() => computeStats(posts), [posts]);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="size-6" /> Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Colle une URL Instagram → ajoute au calendrier en 1 clic.
          </p>
        </div>
        <Button variant="gradient" onClick={() => openEditor()}>
          <Plus className="size-4" /> Nouveau
        </Button>
      </div>

      {loading ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Chargement…</CardContent></Card>
      ) : (
        <>
          {/* Big paste URL prompt — simplest UX */}
          <Card className="border-primary/30">
            <CardContent className="p-5">
              <button
                onClick={() => openEditor()}
                className="w-full text-left rounded-lg border-2 border-dashed border-border hover:border-primary/50 p-6 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                    <LinkIcon className="size-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">Colle une URL Instagram</p>
                    <p className="text-sm text-muted-foreground">
                      Reel · Post · Carrousel · Story → on extrait l&apos;image et la caption automatiquement
                    </p>
                  </div>
                  <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-primary" />
                </div>
              </button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat label="Cette semaine" value={stats.thisWeek} hint={`${stats.publishedThisWeek} publié·s`} />
            <MiniStat label="À programmer" value={stats.ideas} hint="brouillons + idées" />
            <MiniStat label="Posts publiés" value={stats.totalPublished} hint="depuis toujours" />
            <MiniStat label="Vues totales" value={stats.totalViews} hint="cumul publications" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Prochains posts */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">À venir</CardTitle>
                  <CardDescription>Prochains posts programmés</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/calendar">Calendrier <ArrowUpRight className="size-3.5" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {stats.upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Aucun post programmé.</p>
                ) : (
                  stats.upcoming.slice(0, 5).map((p) => (
                    <PostRow key={p.id} post={p} onClick={() => openEditor(p.id)} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Résultats récents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="size-4" /> Résultats récents
                </CardTitle>
                <CardDescription>Performance des derniers posts publiés</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.recentPublished.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Aucun post publié avec métriques. Marque tes posts comme &quot;Publié&quot; et saisis les vues/likes pour suivre tes résultats.
                  </p>
                ) : (
                  stats.recentPublished.slice(0, 5).map((p) => (
                    <ResultRow key={p.id} post={p} onClick={() => openEditor(p.id)} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{formatNumber(value)}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function PostRow({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
    >
      {post.visual_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.visual_url} alt="" className="size-10 rounded-md object-cover shrink-0" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
      ) : (
        <span className="size-10 rounded-md flex items-center justify-center text-base bg-muted shrink-0">
          {FORMATS[post.format].emoji}
        </span>
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
      <Badge variant={post.funnel_stage.toLowerCase() as never} className="shrink-0 text-[10px]">{post.funnel_stage}</Badge>
    </button>
  );
}

function ResultRow({ post, onClick }: { post: Post; onClick: () => void }) {
  const perf = post.performance ?? {};
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
    >
      {post.visual_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.visual_url} alt="" className="size-10 rounded-md object-cover shrink-0" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
      ) : (
        <span className="size-10 rounded-md flex items-center justify-center text-base bg-muted shrink-0">
          {FORMATS[post.format].emoji}
        </span>
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
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const thisWeek = posts.filter((p) => p.scheduled_for && new Date(p.scheduled_for) >= weekStart && new Date(p.scheduled_for) < weekEnd);
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

  return {
    thisWeek: thisWeek.length,
    publishedThisWeek: thisWeek.filter((p) => p.status === "PUBLISHED").length,
    ideas: posts.filter((p) => p.status === "IDEA" || p.status === "DRAFT").length,
    totalPublished: posts.filter((p) => p.status === "PUBLISHED").length,
    totalViews,
    upcoming,
    recentPublished,
  };
}
