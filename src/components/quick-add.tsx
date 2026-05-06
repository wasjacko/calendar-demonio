"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Loader2,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Trash2,
  ExternalLink,
  Check,
  Undo,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/copy-button";
import { useUIStore, useDataStore } from "@/lib/store";
import { updatePost, deletePost } from "@/lib/posts";
import {
  CONTENT_TYPES,
  type ContentType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuickAdd() {
  const { editorOpen, editorPostId, closeEditor } = useUIStore();
  const { posts, upsertPost, removePost } = useDataStore();
  const post = React.useMemo(() => posts.find((p) => p.id === editorPostId) ?? null, [posts, editorPostId]);

  const [category, setCategory] = React.useState<ContentType | null>(null);
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [views, setViews] = React.useState("");
  const [likes, setLikes] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [saves, setSaves] = React.useState("");

  React.useEffect(() => {
    if (!editorOpen || !post) return;
    setCategory(post.content_type);
    setNotes(post.notes ?? "");
    const perf = post.performance ?? {};
    setViews(perf.views?.toString() ?? "");
    setLikes(perf.likes?.toString() ?? "");
    setComments(perf.comments?.toString() ?? "");
    setSaves(perf.saves?.toString() ?? "");
  }, [editorOpen, post]);

  if (!post) return null;

  const isDone = post.status === "PUBLISHED";

  const onSave = async () => {
    setSubmitting(true);
    try {
      const performance = {
        views: views ? parseInt(views, 10) : undefined,
        likes: likes ? parseInt(likes, 10) : undefined,
        comments: comments ? parseInt(comments, 10) : undefined,
        saves: saves ? parseInt(saves, 10) : undefined,
      };
      const hasPerformance = Object.values(performance).some((v) => v !== undefined);

      const updated = await updatePost(post.id, {
        content_type: category,
        notes: notes.trim() || null,
        performance: hasPerformance ? performance : null,
      });
      upsertPost(updated);
      toast.success("Mis à jour");
      closeEditor();
    } catch {
      toast.error("Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${post.title}" ?`)) return;
    try {
      await deletePost(post.id);
      removePost(post.id);
      toast.success("Supprimée");
      closeEditor();
    } catch {
      toast.error("Erreur");
    }
  };

  const toggleDone = async () => {
    try {
      const updated = await updatePost(post.id, {
        status: isDone ? "SCHEDULED" : "PUBLISHED",
      });
      upsertPost(updated);
      toast.success(isDone ? "Marquée à faire" : "Marquée fait");
    } catch {
      toast.error("Erreur");
    }
  };

  const removeFromDay = async () => {
    try {
      const updated = await updatePost(post.id, {
        week_slot: null,
        scheduled_for: null,
        status: "IDEA",
      });
      upsertPost(updated);
      toast.success("Renvoyée au pool");
      closeEditor();
    } catch {
      toast.error("Erreur");
    }
  };

  const isAssigned = !!post.week_slot || !!post.scheduled_for;

  return (
    <Dialog open={editorOpen} onOpenChange={(o) => !o && closeEditor()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="flex flex-col max-h-[95svh] sm:max-h-[92vh]">
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          <DialogHeader className="px-5 pt-3 sm:pt-5 pb-3 border-b border-border">
            <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight line-clamp-1 pr-8">
              {post.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Preview */}
            {post.visual_url && (
              <a
                href={post.source_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "block relative aspect-[4/5] sm:aspect-[1.91/1] w-full bg-muted rounded-xl overflow-hidden",
                  !post.source_url && "pointer-events-none"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.visual_url}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              </a>
            )}

            {/* URL actions */}
            {post.source_url && (
              <div className="flex gap-2">
                <CopyButton
                  value={post.source_url}
                  label="Copier l'URL"
                  className="border border-border h-9 px-3 text-xs"
                  size="sm"
                />
                <Button variant="outline" size="sm" asChild className="h-9 text-xs">
                  <a href={post.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" /> Ouvrir
                  </a>
                </Button>
              </div>
            )}

            {/* Catégorie */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Catégorie</Label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(CONTENT_TYPES) as ContentType[]).map((t) => {
                  const isActive = category === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCategory(isActive ? null : t)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
                        isActive
                          ? `bg-${CONTENT_TYPES[t].color} text-white`
                          : "bg-muted/50 hover:bg-accent text-foreground"
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", isActive ? "bg-white/80" : `bg-${CONTENT_TYPES[t].color}`)} />
                      {CONTENT_TYPES[t].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="…"
                rows={3}
                className="w-full bg-transparent border-0 py-1 text-sm placeholder:text-muted-foreground/70 focus:outline-none resize-none"
              />
            </div>

            {/* Métriques (si fait) */}
            {isDone && (
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Résultats</Label>
                <div className="grid grid-cols-4 gap-2">
                  <MetricInput icon={Eye} label="Vues" value={views} onChange={setViews} />
                  <MetricInput icon={Heart} label="Likes" value={likes} onChange={setLikes} />
                  <MetricInput icon={MessageCircle} label="Comm." value={comments} onChange={setComments} />
                  <MetricInput icon={Bookmark} label="Saves" value={saves} onChange={setSaves} />
                </div>
              </div>
            )}

            {/* Actions secondaires */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={toggleDone}
                className={cn(
                  "text-xs px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors",
                  isDone
                    ? "text-muted-foreground hover:text-foreground hover:bg-accent"
                    : "bg-status-published/10 text-status-published hover:bg-status-published/20"
                )}
              >
                {isDone ? <><Undo className="size-3.5" /> À refaire</> : <><Check className="size-3.5" /> Marquer fait</>}
              </button>
              {isAssigned && (
                <button
                  type="button"
                  onClick={removeFromDay}
                  className="text-xs px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-1.5"
                >
                  Retirer du jour
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs px-3 py-2 rounded-md text-destructive hover:bg-destructive/10 flex items-center gap-1.5 ml-auto"
              >
                <Trash2 className="size-3.5" /> Supprimer
              </button>
            </div>
          </div>

          <div
            className="border-t border-border p-3 flex gap-2 items-center bg-card"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <Button type="button" variant="outline" onClick={closeEditor} className="flex-1 sm:flex-initial h-10">
              Annuler
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={onSave}
              disabled={submitting}
              className="flex-1 h-10"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricInput({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] flex items-center gap-1 text-muted-foreground">
        <Icon className="size-3" /> {label}
      </Label>
      <input
        type="number"
        inputMode="numeric"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-md border border-border bg-transparent px-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground"
      />
    </div>
  );
}
