"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Loader2,
  Link as LinkIcon,
  Sparkles,
  X,
  Calendar as CalendarIcon,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyButton } from "@/components/copy-button";
import { useUIStore, useDataStore } from "@/lib/store";
import { createPost, updatePost, deletePost, publishPost } from "@/lib/posts";
import { useCurrentSalve } from "@/lib/use-current-salve";
import {
  CONTENT_TYPES,
  FORMATS,
  STATUSES,
  WEEK_SLOTS,
  WEEK_SLOTS_ORDER,
  SALVE_PATTERNS,
  type ContentType,
  type ContentFormat,
  type ContentStatus,
  type WeekSlot,
  type Post,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface PreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
  format: ContentFormat | "OTHER";
  detected_platform: string;
  hashtags: string[];
}

export function QuickAdd() {
  const { editorOpen, editorPostId, selectedDate, closeEditor } = useUIStore();
  const { posts, upsertPost, removePost } = useDataStore();
  const post = React.useMemo(() => posts.find((p) => p.id === editorPostId) ?? null, [posts, editorPostId]);
  const current = useCurrentSalve();

  const [url, setUrl] = React.useState("");
  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [preview, setPreview] = React.useState<PreviewData | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [contentType, setContentType] = React.useState<ContentType>("ATTACHEMENT");
  const [format, setFormat] = React.useState<ContentFormat>("REEL");
  const [status, setStatus] = React.useState<ContentStatus>("IDEA");
  const [scheduledFor, setScheduledFor] = React.useState<string | null>(null);
  const [weekSlot, setWeekSlot] = React.useState<WeekSlot | null>(null);
  const [note, setNote] = React.useState("");

  const [views, setViews] = React.useState("");
  const [likes, setLikes] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [saves, setSaves] = React.useState("");

  React.useEffect(() => {
    if (!editorOpen) return;
    if (post) {
      setUrl(post.source_url ?? "");
      setTitle(post.title);
      setContentType(post.content_type ?? "ATTACHEMENT");
      setFormat(post.format);
      setStatus(post.status);
      setScheduledFor(post.scheduled_for);
      setWeekSlot(post.week_slot ?? null);
      setNote(post.notes ?? "");
      const perf = post.performance ?? {};
      setViews(perf.views?.toString() ?? "");
      setLikes(perf.likes?.toString() ?? "");
      setComments(perf.comments?.toString() ?? "");
      setSaves(perf.saves?.toString() ?? "");
      if (post.og_data) setPreview(post.og_data as never);
      else setPreview(null);
    } else {
      setUrl("");
      setTitle("");
      setContentType("ATTACHEMENT");
      setFormat("REEL");
      setStatus(selectedDate ? "SCHEDULED" : "IDEA");
      setScheduledFor(selectedDate);
      setNote("");
      setViews("");
      setLikes("");
      setComments("");
      setSaves("");
      setPreview(null);
      setWeekSlot(null);
    }
  }, [editorOpen, post, selectedDate]);

  // Quand on choisit un slot, on déduit le content_type recommandé (basé sur la salve courante)
  React.useEffect(() => {
    if (post || !weekSlot) return;
    const recommended = SALVE_PATTERNS[current.salve]?.[weekSlot];
    if (recommended) setContentType(recommended);
  }, [weekSlot, current.salve, post]);

  const fetchPreview = async (urlToFetch: string) => {
    if (!urlToFetch.startsWith("http")) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(urlToFetch)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as PreviewData;
      setPreview(data);
      if (data.title && !title) setTitle(data.title.slice(0, 120));
      if (data.format && data.format !== "OTHER") setFormat(data.format as ContentFormat);
      toast.success("Aperçu chargé");
    } catch (err) {
      toast.error("Aperçu indisponible", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleUrlPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (pasted.startsWith("http")) {
      setUrl(pasted);
      setTimeout(() => fetchPreview(pasted), 100);
    }
  };

  const handleUrlBlur = () => {
    if (url && url.startsWith("http") && !preview) fetchPreview(url);
  };

  const handleSlotChange = (slot: WeekSlot) => {
    setWeekSlot(slot);
    const slotInfo = WEEK_SLOTS[slot];
    const baseDate = scheduledFor ? new Date(scheduledFor) : new Date();
    const day = baseDate.getDay();
    const targetDay = slotInfo.dayIdx;
    const diff = targetDay - day;
    baseDate.setDate(baseDate.getDate() + diff);
    baseDate.setHours(slotInfo.hour, slotInfo.minute, 0, 0);
    setScheduledFor(baseDate.toISOString());
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      toast.error("Donne au moins un titre");
      return;
    }
    setSubmitting(true);
    try {
      const performance = {
        views: views ? parseInt(views, 10) : undefined,
        likes: likes ? parseInt(likes, 10) : undefined,
        comments: comments ? parseInt(comments, 10) : undefined,
        saves: saves ? parseInt(saves, 10) : undefined,
      };
      const hasPerformance = Object.values(performance).some((v) => v !== undefined);

      const payload = {
        title: title.trim(),
        notes: note.trim() || null,
        format,
        content_type: contentType,
        status,
        scheduled_for: scheduledFor,
        source_url: url.trim() || null,
        og_data: preview,
        visual_url: preview?.image ?? null,
        hashtags: preview?.hashtags ?? [],
        performance: hasPerformance ? performance : null,
        week_slot: weekSlot,
        salve_number: current.salve,
        legion_number: current.legion,
      };

      const saved = post
        ? await updatePost(post.id, payload as never)
        : await createPost(payload as never);
      upsertPost(saved);
      toast.success(post ? "Mis à jour" : "Ajouté", { description: saved.title });
      closeEditor();
    } catch (err) {
      toast.error("Erreur", { description: err instanceof Error ? err.message : undefined });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm(`Supprimer "${post.title}" ?`)) return;
    try {
      await deletePost(post.id);
      removePost(post.id);
      toast.success("Supprimé");
      closeEditor();
    } catch {
      toast.error("Erreur");
    }
  };

  const handlePublish = async () => {
    if (!post) return;
    try {
      const updated = await publishPost(post.id);
      upsertPost(updated);
      toast.success("Marqué publié");
    } catch {
      toast.error("Erreur");
    }
  };

  const showMetrics = status === "PUBLISHED" || views || likes || comments || saves;

  return (
    <Dialog open={editorOpen} onOpenChange={(o) => !o && closeEditor()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <div className="flex flex-col max-h-[95svh] sm:max-h-[92vh]">
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          <DialogHeader className="px-4 sm:px-5 pt-4 pb-3 border-b border-border">
            <DialogTitle className="text-base sm:text-lg">
              {post ? "Modifier le post" : "Nouveau post"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
            {/* 1. URL — focal */}
            <div className="space-y-1.5">
              <Label htmlFor="url" className="text-xs uppercase tracking-wide font-semibold flex items-center gap-1.5">
                <LinkIcon className="size-3.5" /> Lien
              </Label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Input
                    id="url"
                    type="url"
                    placeholder="Colle l'URL Instagram ici"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onPaste={handleUrlPaste}
                    onBlur={handleUrlBlur}
                    autoFocus={!post}
                    className="h-11"
                  />
                  {loadingPreview && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {url && !loadingPreview && (
                  <>
                    <CopyButton value={url} className="border border-border h-11 px-3" size="md" />
                    <Button type="button" size="default" variant="outline" className="h-11 px-3" asChild>
                      <a href={url} target="_blank" rel="noopener noreferrer" title="Ouvrir">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                    <Button type="button" size="default" variant="outline" className="h-11 px-3" onClick={() => fetchPreview(url)} title="Re-analyser">
                      <Sparkles className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* 2. Preview vidéo */}
            {preview?.image && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-[4/5] sm:aspect-[1.91/1] w-full bg-muted rounded-lg overflow-hidden border border-border group/preview"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.image}
                  alt={preview.title ?? ""}
                  className="absolute inset-0 size-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  {preview.title && (
                    <p className="text-white text-xs font-medium line-clamp-2">{preview.title}</p>
                  )}
                  {preview.site_name && (
                    <p className="text-white/70 text-[10px] mt-0.5">{preview.site_name}</p>
                  )}
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover/preview:opacity-100 transition-opacity">
                  <div className="bg-white/95 text-black px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1">
                    <ExternalLink className="size-3" /> Ouvrir
                  </div>
                </div>
              </a>
            )}

            {/* 3. Catégorie + Format */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide font-semibold">Catégorie</Label>
                <div className="grid grid-cols-2 gap-1">
                  {(Object.keys(CONTENT_TYPES) as ContentType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setContentType(t)}
                      className={cn(
                        "h-10 rounded-md border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                        contentType === t
                          ? `bg-${CONTENT_TYPES[t].color} text-white border-transparent`
                          : "border-border hover:bg-accent"
                      )}
                    >
                      <span className={cn("size-2 rounded-full", contentType === t ? "bg-white/80" : `bg-${CONTENT_TYPES[t].color}`)} />
                      {CONTENT_TYPES[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide font-semibold">Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as ContentFormat)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FORMATS) as ContentFormat[]).map((f) => (
                      <SelectItem key={f} value={f}>{FORMATS[f].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUSES) as ContentStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUSES[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 4. Titre */}
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs uppercase tracking-wide font-semibold">Titre</Label>
              <Input
                id="title"
                placeholder="Donne un nom à ce post"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11"
              />
            </div>

            {/* 5. Slot + Date */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide font-semibold">Créneau</Label>
                <Select value={weekSlot ?? ""} onValueChange={(v) => handleSlotChange(v as WeekSlot)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    {WEEK_SLOTS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>{WEEK_SLOTS[s].shortLabel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide font-semibold flex items-center gap-1">
                  <CalendarIcon className="size-3" /> Date
                </Label>
                <Input
                  type="datetime-local"
                  value={scheduledFor ? toLocalDatetime(scheduledFor) : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setScheduledFor(v ? new Date(v).toISOString() : null);
                    if (v && status === "IDEA") setStatus("SCHEDULED");
                  }}
                  className="h-10"
                />
              </div>
            </div>

            {/* 6. Note (optionnel) */}
            <div className="space-y-1">
              <Label htmlFor="note" className="text-xs uppercase tracking-wide font-semibold">
                Note <span className="text-muted-foreground font-normal normal-case">(facultatif)</span>
              </Label>
              <Textarea
                id="note"
                placeholder="Idées, références, à faire..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            {/* 7. Métriques (si publié) */}
            {showMetrics && (
              <div className="rounded-lg bg-muted/40 p-3 space-y-2">
                <Label className="text-xs uppercase tracking-wide font-semibold">Résultats</Label>
                <div className="grid grid-cols-4 gap-2">
                  <MetricInput icon={Eye} label="Vues" value={views} onChange={setViews} />
                  <MetricInput icon={Heart} label="Likes" value={likes} onChange={setLikes} />
                  <MetricInput icon={MessageCircle} label="Comm." value={comments} onChange={setComments} />
                  <MetricInput icon={Bookmark} label="Saves" value={saves} onChange={setSaves} />
                </div>
              </div>
            )}

            {/* Salve attribution discrete (read-only) */}
            <div className="text-[11px] text-muted-foreground flex items-center justify-between border-t border-border pt-3">
              <span>Légion {current.legion} · Salve {current.salve}</span>
              {weekSlot && (
                <Badge variant={contentType.toLowerCase() as never} className="text-[9px]">
                  {CONTENT_TYPES[contentType].label}
                </Badge>
              )}
            </div>
          </div>

          <div
            className="sticky bottom-0 z-10 border-t border-border p-3 flex gap-2 items-center bg-card"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {post && (
              <Button type="button" variant="ghost" size="default" onClick={handleDelete} className="text-destructive shrink-0 size-10 px-0">
                <Trash2 className="size-4" />
              </Button>
            )}
            {post && status !== "PUBLISHED" && (
              <Button type="button" variant="outline" size="default" onClick={handlePublish} className="hidden sm:inline-flex">
                Marquer publié
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="outline" size="default" onClick={closeEditor} className="hidden sm:inline-flex">
              Annuler
            </Button>
            <Button
              type="button"
              variant="gradient"
              size="default"
              onClick={onSubmit}
              disabled={submitting}
              className="flex-1 sm:flex-initial h-11 sm:h-10"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {post ? "Sauvegarder" : "Ajouter"}
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
      <Input
        type="number"
        inputMode="numeric"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-xs"
      />
    </div>
  );
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
