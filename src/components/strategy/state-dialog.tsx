"use client";

import * as React from "react";
import {
  Circle,
  CircleDashed,
  CircleCheck,
  ExternalLink,
  Pencil,
  Trash2,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDataStore, useUIStore } from "@/lib/store";
import { updatePost } from "@/lib/posts";
import {
  CONTENT_TYPES,
  WEEK_SLOTS,
  type InspiStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const STATE_OPTIONS: Array<{
  key: InspiStatus;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  bg: string;
  bgActive: string;
  text: string;
}> = [
  {
    key: "TODO",
    label: "À faire",
    icon: Circle,
    bg: "bg-sky-50 hover:bg-sky-100 border-sky-200",
    bgActive: "bg-sky-500 border-sky-500 text-white",
    text: "text-sky-700",
  },
  {
    key: "DOING",
    label: "En cours",
    icon: CircleDashed,
    bg: "bg-amber-50 hover:bg-amber-100 border-amber-200",
    bgActive: "bg-amber-500 border-amber-500 text-white",
    text: "text-amber-700",
  },
  {
    key: "DONE",
    label: "Fait",
    icon: CircleCheck,
    bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
    bgActive: "bg-emerald-500 border-emerald-500 text-white",
    text: "text-emerald-700",
  },
];

export function StateDialog({
  open,
  postId,
  onClose,
}: {
  open: boolean;
  postId: string | null;
  onClose: () => void;
}) {
  const { posts, upsertPost } = useDataStore();
  const { openEditor } = useUIStore();
  const post = React.useMemo(
    () => posts.find((p) => p.id === postId) ?? null,
    [posts, postId]
  );

  if (!post) return null;

  const typeInfo = post.content_type ? CONTENT_TYPES[post.content_type] : null;
  const inspi = post.inspi_status;

  const setState = async (next: InspiStatus | null) => {
    try {
      const updated = await updatePost(post.id, { inspi_status: next });
      upsertPost(updated);
      if (next) onClose();
    } catch {
      toast.error("Erreur");
    }
  };

  const removeFromSlot = async () => {
    try {
      const updated = await updatePost(post.id, {
        legion_number: null,
        salve_number: null,
        week_slot: null,
        inspi_status: null,
        status: "IDEA",
      });
      upsertPost(updated);
      toast.success("Retirée du planning");
      onClose();
    } catch {
      toast.error("Erreur");
    }
  };

  const slotLabel =
    post.legion_number && post.salve_number && post.week_slot
      ? `Salve ${post.legion_number} · Semaine ${post.salve_number} · ${WEEK_SLOTS[post.week_slot].shortLabel}`
      : "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="flex flex-col max-h-[90svh]">
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          <DialogHeader className="px-5 pt-3 sm:pt-5 pb-4 border-b border-border">
            <DialogTitle className="text-base font-semibold tracking-tight line-clamp-1 pr-8">
              {post.title}
            </DialogTitle>
            {slotLabel && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {slotLabel}
              </p>
            )}
          </DialogHeader>

          {/* Inspi reference */}
          {(post.visual_url || post.source_url) && (
            <div className="px-5 py-4 border-b border-border">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                Inspiration
              </p>
              <div className="flex items-center gap-3">
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
                  <div className="size-14 rounded-xl bg-muted shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {typeInfo && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <span
                        className={`size-1.5 rounded-full bg-${typeInfo.color}`}
                      />
                      {typeInfo.label}
                    </span>
                  )}
                </div>
                {post.source_url && (
                  <a
                    href={post.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-9 rounded-full border border-border hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Ouvrir la source"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* États — action principale */}
          <div className="px-5 py-5 space-y-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              État de production
            </p>
            <div className="grid grid-cols-3 gap-2">
              {STATE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = inspi === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setState(isActive ? null : opt.key)}
                    className={cn(
                      "rounded-2xl border-2 px-3 py-4 text-sm font-semibold flex flex-col items-center gap-2 transition-all active:scale-[0.97]",
                      isActive ? opt.bgActive : `${opt.bg} ${opt.text}`
                    )}
                  >
                    <Icon
                      className="size-6"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {inspi && (
              <button
                type="button"
                onClick={() => setState(null)}
                className="text-[11px] text-muted-foreground hover:text-foreground w-full text-center pt-1"
              >
                Effacer l&apos;état
              </button>
            )}
          </div>

          {/* Actions secondaires */}
          <div
            className="border-t border-border p-3 flex items-center gap-2 bg-card"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                openEditor(post.id);
              }}
              className="flex-1 h-10 rounded-xl"
            >
              <Pencil className="size-3.5" /> Détails
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={removeFromSlot}
              className="h-10 rounded-xl text-muted-foreground hover:text-destructive hover:border-destructive/40"
              title="Retirer du planning et renvoyer au pool"
            >
              <Inbox className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (!confirm(`Supprimer "${post.title}" ?`)) return;
                try {
                  const { deletePost } = await import("@/lib/posts");
                  await deletePost(post.id);
                  useDataStore.getState().removePost(post.id);
                  toast.success("Supprimée");
                  onClose();
                } catch {
                  toast.error("Erreur");
                }
              }}
              className="h-10 rounded-xl text-destructive hover:bg-destructive/10"
              title="Supprimer"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
