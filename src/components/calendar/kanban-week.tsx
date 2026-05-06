"use client";

import * as React from "react";
import { Check, Plus, ExternalLink } from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { updatePost } from "@/lib/posts";
import { CONTENT_TYPES, FORMATS, type Post, type WeekSlot } from "@/lib/types";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DAYS = [
  { key: "MON", label: "Lundi", short: "Lun" },
  { key: "TUE", label: "Mardi", short: "Mar" },
  { key: "WED", label: "Mercredi", short: "Mer" },
  { key: "THU", label: "Jeudi", short: "Jeu" },
  { key: "FRI", label: "Vendredi", short: "Ven" },
  { key: "SAT", label: "Samedi", short: "Sam" },
  { key: "SUN", label: "Dimanche", short: "Dim" },
] as const;

type DayKey = typeof DAYS[number]["key"];

const SLOT_TO_DAY: Record<WeekSlot, DayKey> = {
  MON_0631: "MON",
  TUE_1104: "TUE",
  WED_1217: "WED",
  FRI_1600: "FRI",
  SUN_0500: "SUN",
};

const DAY_TO_SLOT: Partial<Record<DayKey, WeekSlot>> = {
  MON: "MON_0631",
  TUE: "TUE_1104",
  WED: "WED_1217",
  FRI: "FRI_1600",
  SUN: "SUN_0500",
};

function getDayFromDate(iso: string | null): DayKey | null {
  if (!iso) return null;
  const d = new Date(iso);
  // JS: 0=Sun, 1=Mon, …, 6=Sat
  const map: Record<number, DayKey> = { 0: "SUN", 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT" };
  return map[d.getDay()];
}

export function KanbanWeek() {
  const { posts, upsertPost } = useDataStore();
  const { openEditor, filters } = useUIStore();

  const filtered = React.useMemo(() => {
    return posts.filter((p) => {
      if (filters.contentType.length > 0 && p.content_type && !filters.contentType.includes(p.content_type)) return false;
      if (filters.status.length > 0 && !filters.status.includes(p.status)) return false;
      if (filters.search.trim() !== "") {
        const q = filters.search.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inCaption = (p.caption ?? "").toLowerCase().includes(q);
        if (!inTitle && !inCaption) return false;
      }
      return true;
    });
  }, [posts, filters]);

  const postsByDay = React.useMemo(() => {
    const map: Record<DayKey, Post[]> = {
      MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: [], SUN: [],
    };
    filtered.forEach((p) => {
      let dayKey: DayKey | null = null;
      if (p.week_slot) dayKey = SLOT_TO_DAY[p.week_slot] ?? null;
      if (!dayKey) dayKey = getDayFromDate(p.scheduled_for);
      if (dayKey) map[dayKey].push(p);
    });
    // Sort: not done first, then by title
    Object.keys(map).forEach((k) => {
      map[k as DayKey].sort((a, b) => {
        const aDone = a.status === "PUBLISHED" ? 1 : 0;
        const bDone = b.status === "PUBLISHED" ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return a.title.localeCompare(b.title);
      });
    });
    return map;
  }, [filtered]);

  const toggleDone = async (post: Post) => {
    const isDone = post.status === "PUBLISHED";
    try {
      const updated = await updatePost(post.id, {
        status: isDone ? "SCHEDULED" : "PUBLISHED",
      });
      upsertPost(updated);
      toast.success(isDone ? "Marqué à faire" : "Marqué fait");
    } catch {
      toast.error("Erreur");
    }
  };

  const addToDay = (dayKey: DayKey) => {
    const slot = DAY_TO_SLOT[dayKey];
    if (slot) {
      // Use the predefined slot date (helps Strategy linking)
      openEditor(null, null);
    } else {
      openEditor(null, null);
    }
  };

  return (
    <div className="overflow-x-auto pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6 snap-x snap-mandatory scroll-pl-4">
      <div className="flex gap-3 min-w-max">
        {DAYS.map((day) => {
          const dayPosts = postsByDay[day.key];
          const filled = dayPosts.length;
          const done = dayPosts.filter((p) => p.status === "PUBLISHED").length;
          return (
            <div key={day.key} className="w-72 sm:w-64 shrink-0 snap-start">
              <div className="flex items-baseline justify-between px-1 mb-3">
                <p className="font-semibold tracking-tight">{day.label}</p>
                {filled > 0 ? (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {done}/{filled}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">—</p>
                )}
              </div>
              <div className="space-y-2">
                {dayPosts.map((p) => (
                  <KanbanCard
                    key={p.id}
                    post={p}
                    onClick={() => openEditor(p.id)}
                    onToggleDone={() => toggleDone(p)}
                  />
                ))}
                <button
                  onClick={() => addToDay(day.key)}
                  className="w-full py-3 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="size-3.5" /> Ajouter
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({
  post,
  onClick,
  onToggleDone,
}: {
  post: Post;
  onClick: () => void;
  onToggleDone: () => void;
}) {
  const isDone = post.status === "PUBLISHED";
  const typeInfo = post.content_type ? CONTENT_TYPES[post.content_type] : null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden transition-all",
        isDone && "opacity-60"
      )}
    >
      {post.visual_url && (
        <button
          type="button"
          onClick={onClick}
          className="block w-full aspect-[4/5] bg-muted relative group"
        >
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
        </button>
      )}
      <div className="p-3 space-y-2">
        <button
          type="button"
          onClick={onClick}
          className="w-full text-left"
        >
          <p className={cn("text-sm font-medium leading-snug line-clamp-2", isDone && "line-through")}>
            {post.title}
          </p>
        </button>
        <div className="flex items-center gap-1.5">
          {!post.visual_url && typeInfo && (
            <span className={`size-1.5 rounded-full bg-${typeInfo.color}`} />
          )}
          {typeInfo && (
            <span className="text-[10px] text-muted-foreground">{typeInfo.label}</span>
          )}
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">{FORMATS[post.format].label}</span>

          {post.source_url && (
            <CopyButton value={post.source_url} className="ml-auto -mr-1" size="xs" />
          )}
          {post.source_url && (
            <a
              href={post.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
              title="Ouvrir"
            >
              <ExternalLink className="size-3" />
            </a>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDone();
            }}
            className={cn(
              "size-6 rounded-full border flex items-center justify-center transition-colors shrink-0",
              isDone
                ? "bg-status-published border-status-published text-white"
                : "border-border hover:border-primary"
            )}
            title={isDone ? "Marquer à faire" : "Marquer fait"}
            aria-label={isDone ? "Marquer à faire" : "Marquer fait"}
          >
            {isDone && <Check className="size-3.5" strokeWidth={3} />}
          </button>
        </div>
      </div>
    </div>
  );
}
