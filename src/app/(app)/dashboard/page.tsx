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
  Target,
} from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CopyButton } from "@/components/copy-button";
import {
  CONTENT_TYPES,
  FORMATS,
  STATUSES,
  WEEK_SLOTS,
  WEEK_SLOTS_ORDER,
  SALVE_PATTERNS,
  getLegionAndSalve,
  getDateForSlot,
  type Post,
} from "@/lib/types";
import { formatRelative, cn } from "@/lib/utils";

export default function DashboardPage() {
  const { posts, loading } = useDataStore();
  const { openEditor } = useUIStore();

  const today = React.useMemo(() => new Date(), []);
  const currentInfo = React.useMemo(() => getLegionAndSalve(today), [today]);
  const stats = React.useMemo(() => computeStats(posts, currentInfo), [posts, currentInfo]);

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="size-6" /> Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Légion <strong>{currentInfo.legion}</strong> · Salve <strong>{currentInfo.salve}</strong> en cours.
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
          {/* Big paste URL prompt */}
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
                    <p className="font-semibold">Nouveau post</p>
                    <p className="text-sm text-muted-foreground">
                      Colle une URL de référence Insta + choisis le slot de la salve
                    </p>
                  </div>
                  <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-primary" />
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Salve actuelle progress */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="size-4" /> Salve {currentInfo.salve} — {stats.salveCompletion.filled}/5 posts
                </CardTitle>
                <CardDescription>Cette semaine</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/strategy">Voir Légion <ArrowUpRight className="size-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Progress value={(stats.salveCompletion.filled / 5) * 100} className="h-2 mb-4" indicatorClassName="gradient-brand" />
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {WEEK_SLOTS_ORDER.map((slot) => {
                  const post = stats.currentSalvePosts.get(slot);
                  const pattern = SALVE_PATTERNS[currentInfo.salve][slot];
                  const typeInfo = CONTENT_TYPES[pattern.type];
                  return (
                    <button
                      key={slot}
                      onClick={() => post ? openEditor(post.id) : openEditor(null, getDateForSlot(currentInfo.legion, currentInfo.salve, slot).toISOString())}
                      className={cn(
                        "rounded-lg border p-2 text-left transition-colors",
                        post ? "border-border hover:bg-accent" : "border-dashed hover:border-primary/50"
                      )}
                    >
                      <p className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground">{WEEK_SLOTS[slot].shortLabel}</p>
                      <Badge variant={pattern.type.toLowerCase() as never} className="mt-1 text-[9px]">
                        {typeInfo.emoji}
                      </Badge>
                      <p className="text-xs mt-1 line-clamp-1">{post ? post.title : pattern.concept}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat label="Posts publiés" value={stats.totalPublished} hint="depuis toujours" />
            <MiniStat label="Vues totales" value={stats.totalViews} hint="cumul" />
            <MiniStat label="Engagement" value={stats.totalEngagement} hint="likes+comments+saves" />
            <MiniStat label="À programmer" value={stats.ideas} hint="brouillons + idées" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="size-4" /> Résultats récents
                </CardTitle>
                <CardDescription>Posts publiés avec leurs métriques</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.recentPublished.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Aucun post publié avec métriques. Marque tes posts &quot;Publié&quot; et saisis vues/likes.
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
    <div className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors group">
      <button onClick={onClick} className="flex items-center gap-3 flex-1 min-w-0 text-left">
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
        {post.content_type && (
          <Badge variant={post.content_type.toLowerCase() as never} className="shrink-0 text-[10px]">
            {CONTENT_TYPES[post.content_type].emoji}
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

function computeStats(posts: Post[], currentInfo: { legion: number; salve: 1 | 2 | 3 }) {
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

  // Posts of current Salve
  const currentSalvePosts = new Map<string, Post>();
  posts.forEach((p) => {
    if (
      p.legion_number === currentInfo.legion &&
      p.salve_number === currentInfo.salve &&
      p.week_slot
    ) {
      currentSalvePosts.set(p.week_slot, p);
    }
  });

  return {
    ideas: posts.filter((p) => p.status === "IDEA" || p.status === "DRAFT").length,
    totalPublished: posts.filter((p) => p.status === "PUBLISHED").length,
    totalViews,
    totalEngagement,
    upcoming,
    recentPublished,
    currentSalvePosts,
    salveCompletion: { filled: currentSalvePosts.size },
  };
}
