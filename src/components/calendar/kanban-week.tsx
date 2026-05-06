"use client";

import * as React from "react";
import { Check, Plus, ChevronRight } from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { updatePost } from "@/lib/posts";
import { CONTENT_TYPES, FORMATS, type Post, type WeekSlot } from "@/lib/types";
import { VideoPicker } from "./video-picker";
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

function getDayFromDate(iso: string | null): DayKey | null {
  if (!iso) return null;
  const d = new Date(iso);
  const map: Record<number, DayKey> = { 0: "SUN", 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT" };
  return map[d.getDay()];
}

export function KanbanWeek() {
  const { posts, upsertPost } = useDataStore();
  const { openEditor } = useUIStore();
  const [pickerDay, setPickerDay] = React.useState<DayKey | null>(null);

  const postsByDay = React.useMemo(() => {
    const map: Record<DayKey, Post[]> = {
      MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: [], SUN: [],
    };
    posts.forEach((p) => {
      let dayKey: DayKey | null = null;
      if (p.week_slot) dayKey = SLOT_TO_DAY[p.week_slot] ?? null;
      if (!dayKey) dayKey = getDayFromDate(p.scheduled_for);
      if (dayKey) map[dayKey].push(p);
    });
    Object.keys(map).forEach((k) => {
      map[k as DayKey].sort((a, b) => {
        const aDone = a.status === "PUBLISHED" ? 1 : 0;
        const bDone = b.status === "PUBLISHED" ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return a.title.localeCompare(b.title);
      });
    });
    return map;
  }, [posts]);

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

  return (
    <>
      <div className="space-y-6">
        {DAYS.map((day) => {
          const dayPosts = postsByDay[day.key];
          const filled = dayPosts.length;
          const done = dayPosts.filter((p) => p.status === "PUBLISHED").length;

          return (
            <section key={day.key} className="space-y-2">
              {/* Header de jour */}
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-base font-semibold tracking-tight">{day.label}</h2>
                {filled > 0 ? (
                  <span className="text-xs text-muted-foreground tabular-nums font-medium">
                    {done}/{filled}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">—</span>
                )}
              </div>

              {/* Cards */}
              <div className="space-y-1.5">
                {dayPosts.map((p) => (
                  <KanbanCard
                    key={p.id}
                    post={p}
                    onClick={() => openEditor(p.id)}
                    onToggleDone={() => toggleDone(p)}
                  />
                ))}
                <button
                  onClick={() => setPickerDay(day.key)}
                  className="w-full flex items-center gap-2 px-3 py-3 rounded-2xl border border-dashed border-border text-sm text-muted-foreground hover:border-foreground/40 hover:text-foreground hover:bg-accent/30 transition-colors"
                >
                  <Plus className="size-4" />
                  <span>Choisir une vidéo</span>
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <VideoPicker
        open={pickerDay !== null}
        dayKey={pickerDay}
        onClose={() => setPickerDay(null)}
      />
    </>
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
        "rounded-2xl border border-border bg-card overflow-hidden transition-opacity",
        isDone && "opacity-60"
      )}
    >
      <div className="flex items-center gap-3 p-2">
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          {/* Thumbnail */}
          <div className="size-14 rounded-lg overflow-hidden shrink-0 bg-muted relative">
            {post.visual_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.visual_url}
                alt=""
                className="absolute inset-0 size-full object-cover"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
              />
            ) : (
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center text-[10px] font-semibold",
                  typeInfo ? `bg-${typeInfo.color}/15 text-${typeInfo.color}` : "text-muted-foreground"
                )}
              >
                {FORMATS[post.format].label.slice(0, 4)}
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0 py-0.5">
            <p
              className={cn(
                "text-sm font-medium leading-snug line-clamp-2",
                isDone && "line-through"
              )}
            >
              {post.title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {typeInfo && <span className={`size-1.5 rounded-full bg-${typeInfo.color}`} />}
              <span className="text-[11px] text-muted-foreground truncate">
                {typeInfo?.label ?? "—"} · {FORMATS[post.format].label}
              </span>
            </div>
          </div>

          <ChevronRight className="size-4 text-muted-foreground/60 shrink-0" />
        </button>

        {/* Done toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone();
          }}
          className={cn(
            "size-9 rounded-full border flex items-center justify-center transition-colors shrink-0",
            isDone
              ? "bg-foreground border-foreground text-background"
              : "border-border hover:border-foreground/40 active:scale-95"
          )}
          title={isDone ? "Marquer à faire" : "Marquer fait"}
          aria-label={isDone ? "Marquer à faire" : "Marquer fait"}
        >
          {isDone && <Check className="size-4" strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
}
