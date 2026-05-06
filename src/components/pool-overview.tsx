"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Inbox } from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { CONTENT_TYPES, FORMATS } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Aperçu rapide du pool sur la home — immédiatement visible sous le form.
 * - Compteur des vidéos en attente (non assignées)
 * - Aperçu des dernières (4) avec tap → éditeur
 * - Lien vers Salve pour les programmer
 */
export function PoolOverview() {
  const { posts } = useDataStore();
  const { openEditor } = useUIStore();

  const pool = React.useMemo(
    () => posts.filter((p) => !p.week_slot && !p.scheduled_for),
    [posts]
  );

  const recent = React.useMemo(
    () =>
      [...pool]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 4),
    [pool]
  );

  // État vide → message accueillant
  if (pool.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 backdrop-blur-md p-5 flex items-center gap-3">
        <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Inbox className="size-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Pool vide. Colle un lien ci-dessus pour démarrer.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-md p-4 sm:p-5 space-y-3 shadow-sm">
      {/* Header avec compteur + CTA Salve */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Pool
          </span>
          <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-foreground text-background">
            {pool.length}
          </span>
        </div>
        <Link
          href="/calendar"
          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 group"
        >
          <Calendar className="size-3.5" />
          Programmer
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Grille de thumbnails récentes */}
      <div className="grid grid-cols-4 gap-2">
        {recent.map((post) => {
          const typeInfo = post.content_type
            ? CONTENT_TYPES[post.content_type]
            : null;
          return (
            <button
              key={post.id}
              type="button"
              onClick={() => openEditor(post.id)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border active:scale-[0.97] transition-transform"
              title={post.title}
            >
              {post.visual_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.visual_url}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.display =
                      "none")
                  }
                />
              ) : (
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center text-[10px] font-semibold",
                    typeInfo
                      ? `bg-${typeInfo.color}/15 text-${typeInfo.color}`
                      : "text-muted-foreground"
                  )}
                >
                  {FORMATS[post.format].label.slice(0, 4)}
                </div>
              )}
              {/* Dot catégorie en bas */}
              {typeInfo && (
                <span
                  className={cn(
                    "absolute bottom-1.5 left-1.5 size-2 rounded-full ring-2 ring-card",
                    `bg-${typeInfo.color}`
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {pool.length > 4 && (
        <p className="text-[11px] text-muted-foreground text-center">
          +{pool.length - 4} autre{pool.length - 4 > 1 ? "s" : ""} dans le pool
        </p>
      )}
    </div>
  );
}
