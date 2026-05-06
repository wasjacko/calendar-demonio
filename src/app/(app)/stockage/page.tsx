"use client";

import * as React from "react";
import { Search, ExternalLink, Inbox } from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import {
  CONTENT_TYPES,
  FORMATS,
  type ContentType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export default function StockagePage() {
  const { posts, loading } = useDataStore();
  const { openEditor } = useUIStore();
  const [search, setSearch] = React.useState("");
  const [filterAlter, setFilterAlter] = React.useState<ContentType | null>(null);

  // Pool = posts non assignés (ni à un week_slot, ni à une légion)
  const pool = React.useMemo(() => {
    return posts
      .filter((p) => !p.week_slot && !p.legion_number)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [posts]);

  const filtered = React.useMemo(() => {
    let list = pool;
    if (filterAlter) {
      list = list.filter((p) => p.content_type === filterAlter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.notes ?? "").toLowerCase().includes(q) ||
          (p.source_url ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [pool, filterAlter, search]);

  // Compteur par alter (calculé sur le pool entier, pas filtré)
  const counts = React.useMemo(() => {
    const map = {} as Record<ContentType, number>;
    (Object.keys(CONTENT_TYPES) as ContentType[]).forEach((t) => {
      map[t] = pool.filter((p) => p.content_type === t).length;
    });
    return map;
  }, [pool]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-12 max-w-3xl mx-auto">
        <p className="text-center text-sm text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-10 max-w-3xl mx-auto space-y-4">
      {/* Header avec compteur */}
      <div className="flex items-baseline justify-between px-1">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {pool.length} vidéo{pool.length > 1 ? "s" : ""} non assignée
          {pool.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher dans le stockage…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-11 rounded-2xl"
        />
      </div>

      {/* Filtres par Alter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilterAlter(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
            filterAlter === null
              ? "bg-foreground text-background border-foreground"
              : "bg-muted/50 hover:bg-accent text-foreground border-transparent"
          )}
        >
          Tout ({pool.length})
        </button>
        {(Object.keys(CONTENT_TYPES) as ContentType[]).map((t) => {
          const isActive = filterAlter === t;
          const count = counts[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setFilterAlter(isActive ? null : t)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 border",
                isActive
                  ? "bg-foreground text-background font-semibold border-foreground"
                  : "bg-muted/50 hover:bg-accent text-foreground font-medium border-transparent"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  `bg-${CONTENT_TYPES[t].color}`,
                  isActive && "ring-2 ring-background"
                )}
              />
              {CONTENT_TYPES[t].label}
              {count > 0 && (
                <span
                  className={cn(
                    "tabular-nums",
                    isActive ? "text-background/80" : "text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-border bg-card/40 p-8 flex flex-col items-center gap-3 mt-2">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center">
            <Inbox className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {pool.length === 0
              ? "Stockage vide. Va sur Home pour ajouter des vidéos."
              : "Aucune vidéo correspondante."}
          </p>
        </div>
      ) : (
        <div className="rounded-[28px] border border-border bg-card overflow-hidden divide-y divide-border">
          {filtered.map((post) => {
            const alterInfo = post.content_type
              ? CONTENT_TYPES[post.content_type]
              : null;
            return (
              <div
                key={post.id}
                className="flex items-center gap-3 p-3 hover:bg-accent/40 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => openEditor(post.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left active:scale-[0.99] transition-transform"
                >
                  {post.visual_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.visual_url}
                      alt=""
                      className="size-14 rounded-xl object-cover shrink-0 bg-muted"
                      onError={(e) =>
                        ((e.currentTarget as HTMLImageElement).style.display =
                          "none")
                      }
                    />
                  ) : (
                    <div
                      className={cn(
                        "size-14 rounded-xl flex items-center justify-center text-[10px] font-semibold shrink-0",
                        alterInfo
                          ? `bg-${alterInfo.color}/15 text-${alterInfo.color}`
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {FORMATS[post.format].label.slice(0, 4)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {alterInfo ? (
                        <>
                          <span
                            className={`size-1.5 rounded-full bg-${alterInfo.color}`}
                          />
                          <span className="text-[11px] text-muted-foreground">
                            {alterInfo.label} · {FORMATS[post.format].label}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Sans alter · {FORMATS[post.format].label}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                {post.source_url && (
                  <a
                    href={post.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="size-9 rounded-full border border-border hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    aria-label="Ouvrir le lien"
                    title="Ouvrir le lien original"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
