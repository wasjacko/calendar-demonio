"use client";

import * as React from "react";
import {
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Search,
  Filter,
  X,
} from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { AddVideoForm } from "@/components/add-video-form";
import {
  CONTENT_TYPES,
  FORMATS,
  STATUSES,
  type ContentType,
  type ContentStatus,
  type Post,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AllForOnePage() {
  const { posts, loading } = useDataStore();
  const { openEditor } = useUIStore();

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<ContentType[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<ContentStatus[]>([]);

  const stats = React.useMemo(() => computeStats(posts), [posts]);

  const filtered = React.useMemo(() => {
    return posts
      .filter((p) => {
        if (typeFilter.length > 0 && (!p.content_type || !typeFilter.includes(p.content_type))) return false;
        if (statusFilter.length > 0 && !statusFilter.includes(p.status)) return false;
        if (search.trim() !== "") {
          const q = search.toLowerCase();
          if (!p.title.toLowerCase().includes(q) &&
              !(p.notes ?? "").toLowerCase().includes(q) &&
              !(p.caption ?? "").toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [posts, typeFilter, statusFilter, search]);

  const toggleType = (t: ContentType) => {
    setTypeFilter((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  };
  const toggleStatus = (s: ContentStatus) => {
    setStatusFilter((arr) => (arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]));
  };
  const activeFilters = typeFilter.length + statusFilter.length;

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-7 max-w-3xl mx-auto space-y-7">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          All For One
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Toutes tes vidéos</h1>
      </div>

      {/* Form inline (Notion-style) */}
      <AddVideoForm />

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-12">Chargement…</p>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <Kpi label="Total" value={posts.length} />
            <Kpi label="Faites" value={stats.published} />
            <Kpi label="Vues" value={stats.totalViews} />
            <Kpi label="Engmt" value={stats.totalEngagement} />
          </div>

          {/* Filtres + grille */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default" className="h-10 px-3 shrink-0">
                    <Filter className="size-4" />
                    {activeFilters > 0 && (
                      <Badge variant="default" className="ml-1 h-5 px-1.5">{activeFilters}</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-3">
                  <DropdownMenuLabel className="px-0 pb-2 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Catégorie</DropdownMenuLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(CONTENT_TYPES) as ContentType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleType(t)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5",
                          typeFilter.includes(t)
                            ? `bg-${CONTENT_TYPES[t].color} text-white border-transparent`
                            : "border-border hover:bg-accent"
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", typeFilter.includes(t) ? "bg-white/80" : `bg-${CONTENT_TYPES[t].color}`)} />
                        {CONTENT_TYPES[t].label}
                      </button>
                    ))}
                  </div>
                  <DropdownMenuSeparator className="my-3" />
                  <DropdownMenuLabel className="px-0 pb-2 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Statut</DropdownMenuLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(STATUSES) as ContentStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleStatus(s)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                          statusFilter.includes(s)
                            ? "bg-foreground text-background border-transparent"
                            : "border-border hover:bg-accent"
                        )}
                      >
                        {STATUSES[s].label}
                      </button>
                    ))}
                  </div>
                  {activeFilters > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => { setTypeFilter([]); setStatusFilter([]); }}
                    >
                      <X className="size-3" /> Réinitialiser
                    </Button>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                {posts.length === 0 ? "Pool vide. Colle ton premier lien plus haut." : "Aucune vidéo trouvée."}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((p) => (
                  <VideoCard key={p.id} post={p} onClick={() => openEditor(p.id)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
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

function VideoCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const typeInfo = post.content_type ? CONTENT_TYPES[post.content_type] : null;
  const isDone = post.status === "PUBLISHED";
  const perf = post.performance ?? {};
  const isInPool = !post.week_slot && !post.scheduled_for;

  return (
    <div className={cn(
      "rounded-xl border border-border bg-card overflow-hidden hover:ring-2 hover:ring-foreground/30 transition-all relative group",
      isDone && "opacity-75"
    )}>
      <button onClick={onClick} className="block w-full text-left">
        {post.visual_url ? (
          <div className="relative aspect-[4/5] bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.visual_url}
              alt=""
              className="absolute inset-0 size-full object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
            {typeInfo && (
              <span className={cn("absolute top-2 left-2 size-2.5 rounded-full ring-2 ring-white/80", `bg-${typeInfo.color}`)} />
            )}
            {!isInPool && (
              <Badge variant={post.status.toLowerCase() as never} className="absolute top-2 right-2 text-[9px]">
                {STATUSES[post.status].label}
              </Badge>
            )}
          </div>
        ) : (
          <div className={cn("aspect-[4/5] flex items-center justify-center text-sm font-semibold", typeInfo ? `bg-${typeInfo.color}/15 text-${typeInfo.color}` : "bg-muted text-muted-foreground")}>
            {FORMATS[post.format].label}
          </div>
        )}
        <div className="p-2.5 space-y-1">
          <p className={cn("text-xs font-medium leading-snug line-clamp-2", isDone && "line-through")}>
            {post.title}
          </p>
          {(perf.views || perf.likes) && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {perf.views !== undefined && <span className="flex items-center gap-0.5"><Eye className="size-2.5" /> {formatNumber(perf.views)}</span>}
              {perf.likes !== undefined && <span className="flex items-center gap-0.5"><Heart className="size-2.5" /> {formatNumber(perf.likes)}</span>}
              {perf.comments !== undefined && <span className="flex items-center gap-0.5"><MessageCircle className="size-2.5" /> {formatNumber(perf.comments)}</span>}
              {perf.saves !== undefined && <span className="flex items-center gap-0.5"><Bookmark className="size-2.5" /> {formatNumber(perf.saves)}</span>}
            </div>
          )}
        </div>
      </button>
      {post.source_url && (
        <div className="absolute top-2 right-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <CopyButton value={post.source_url} className="bg-background/90 backdrop-blur-sm rounded shadow-sm" size="xs" />
        </div>
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
  const totalViews = posts.reduce((sum, p) => sum + (p.performance?.views ?? 0), 0);
  const totalEngagement = posts.reduce((sum, p) => {
    const perf = p.performance ?? {};
    return sum + (perf.likes ?? 0) + (perf.comments ?? 0) + (perf.saves ?? 0);
  }, 0);
  return {
    published: posts.filter((p) => p.status === "PUBLISHED").length,
    totalViews,
    totalEngagement,
  };
}
