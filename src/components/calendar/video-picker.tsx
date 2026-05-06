"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataStore, useUIStore } from "@/lib/store";
import { updatePost } from "@/lib/posts";
import { CONTENT_TYPES, FORMATS, WEEK_SLOTS, type WeekSlot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DAY_TO_SLOT: Partial<Record<string, WeekSlot>> = {
  MON: "MON_0631",
  TUE: "TUE_1104",
  WED: "WED_1217",
  FRI: "FRI_1600",
  SUN: "SUN_0500",
};

const DAY_LABELS: Record<string, string> = {
  MON: "Lundi", TUE: "Mardi", WED: "Mercredi", THU: "Jeudi",
  FRI: "Vendredi", SAT: "Samedi", SUN: "Dimanche",
};

const DAY_TO_JS: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

function dateForDay(dayKey: string): Date {
  const today = new Date();
  const targetJsDay = DAY_TO_JS[dayKey];
  const currentJsDay = today.getDay();
  let diff = targetJsDay - currentJsDay;
  if (diff < 0) diff += 7;
  const date = new Date(today);
  date.setDate(date.getDate() + diff);
  const slot = DAY_TO_SLOT[dayKey];
  if (slot) {
    const slotInfo = WEEK_SLOTS[slot];
    date.setHours(slotInfo.hour, slotInfo.minute, 0, 0);
  } else {
    date.setHours(12, 0, 0, 0);
  }
  return date;
}

export function VideoPicker({
  open,
  dayKey,
  onClose,
}: {
  open: boolean;
  dayKey: string | null;
  onClose: () => void;
}) {
  const { posts, upsertPost } = useDataStore();
  const { openEditor } = useUIStore();
  const [search, setSearch] = React.useState("");

  // Pool = vidéos non assignées à un jour
  const pool = React.useMemo(() => {
    return posts.filter((p) => !p.week_slot && !p.scheduled_for);
  }, [posts]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return pool;
    const q = search.toLowerCase();
    return pool.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.caption ?? "").toLowerCase().includes(q)
    );
  }, [pool, search]);

  React.useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const assign = async (postId: string) => {
    if (!dayKey) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const slot = DAY_TO_SLOT[dayKey];
    const date = dateForDay(dayKey);

    try {
      const updated = await updatePost(post.id, {
        week_slot: slot ?? null,
        scheduled_for: date.toISOString(),
        status: post.status === "IDEA" ? "SCHEDULED" : post.status,
      });
      upsertPost(updated);
      toast.success(`Assignée au ${DAY_LABELS[dayKey]}`);
      onClose();
    } catch {
      toast.error("Erreur");
    }
  };

  const createNew = () => {
    onClose();
    if (!dayKey) {
      openEditor();
      return;
    }
    const date = dateForDay(dayKey);
    openEditor(null, date.toISOString());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="flex flex-col max-h-[90svh]">
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          <DialogHeader className="px-5 pt-3 sm:pt-5 pb-3 border-b border-border">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Ajouter pour {dayKey ? DAY_LABELS[dayKey] : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans le pool…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-2 mb-2">
              All For One ({filtered.length})
            </p>
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">
                {pool.length === 0
                  ? "Pool vide. Crée une nouvelle vidéo ci-dessous."
                  : "Aucune vidéo trouvée."}
              </p>
            ) : (
              <div className="space-y-1">
                {filtered.map((video) => {
                  const typeInfo = video.content_type ? CONTENT_TYPES[video.content_type] : null;
                  return (
                    <button
                      key={video.id}
                      onClick={() => assign(video.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left active:scale-[0.99]"
                    >
                      {video.visual_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.visual_url}
                          alt=""
                          className="size-12 rounded-md object-cover shrink-0"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                        />
                      ) : (
                        <div
                          className={cn(
                            "size-12 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0",
                            typeInfo
                              ? `bg-${typeInfo.color}/15 text-${typeInfo.color}`
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {FORMATS[video.format].label.slice(0, 4)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{video.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {typeInfo && <span className={`size-1.5 rounded-full bg-${typeInfo.color}`} />}
                          <span className="text-[10px] text-muted-foreground">
                            {typeInfo?.label ?? "—"} · {FORMATS[video.format].label}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className="p-3 border-t border-border bg-card"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <Button variant="gradient" className="w-full h-11" onClick={createNew}>
              <Plus className="size-4" /> Créer une nouvelle vidéo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
