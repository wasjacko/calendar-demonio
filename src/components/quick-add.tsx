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
  TrendingUp,
  Send,
  Trash2,
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
import { useUIStore, useDataStore } from "@/lib/store";
import { createPost, updatePost, deletePost, publishPost } from "@/lib/posts";
import {
  CONTENT_TYPES,
  FORMATS,
  STATUSES,
  WEEK_SLOTS,
  WEEK_SLOTS_ORDER,
  SALVE_PATTERNS,
  getLegionAndSalve,
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

  const [url, setUrl] = React.useState("");
  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [preview, setPreview] = React.useState<PreviewData | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [contentType, setContentType] = React.useState<ContentType>("ATTACHEMENT");
  const [format, setFormat] = React.useState<ContentFormat>("REEL");
  const [status, setStatus] = React.useState<ContentStatus>("IDEA");
  const [scheduledFor, setScheduledFor] = React.useState<string | null>(null);
  const [weekSlot, setWeekSlot] = React.useState<WeekSlot | null>(null);
  const [inspiFrom, setInspiFrom] = React.useState("");

  const [views, setViews] = React.useState("");
  const [likes, setLikes] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [saves, setSaves] = React.useState("");

  const computed = React.useMemo(() => {
    if (!scheduledFor) return null;
    return getLegionAndSalve(new Date(scheduledFor));
  }, [scheduledFor]);

  React.useEffect(() => {
    if (!editorOpen) return;
    if (post) {
      setUrl(post.source_url ?? "");
      setTitle(post.title);
      setCaption(post.caption ?? "");
      setContentType(post.content_type ?? "ATTACHEMENT");
      setFormat(post.format);
      setStatus(post.status);
      setScheduledFor(post.scheduled_for);
      setWeekSlot(post.week_slot ?? null);
      setInspiFrom(post.inspi_from ?? "");
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
      setCaption("");
      setContentType("ATTACHEMENT");
      setFormat("REEL");
      setStatus(selectedDate ? "SCHEDULED" : "IDEA");
      setScheduledFor(selectedDate);
      setInspiFrom("");
      setViews("");
      setLikes("");
      setComments("");
      setSaves("");
      setPreview(null);
      // Auto-detect slot from selectedDate
      if (selectedDate) {
        const d = new Date(selectedDate);
        const matched = WEEK_SLOTS_ORDER.find((s) => {
          const info = WEEK_SLOTS[s];
          return d.getDay() === (info.dayIdx as number) && Math.abs(d.getHours() - info.hour) <= 1;
        });
        setWeekSlot(matched ?? null);
        if (matched && computed) {
          const pattern = SALVE_PATTERNS[computed.salve][matched];
          setContentType(pattern.type);
        }
      } else {
        setWeekSlot(null);
      }
    }
  }, [editorOpen, post, selectedDate]);

  // Apply Salve pattern when slot or salve changes (only for new posts)
  React.useEffect(() => {
    if (post || !weekSlot || !computed) return;
    const pattern = SALVE_PATTERNS[computed.salve][weekSlot];
    setContentType(pattern.type);
    if (!inspiFrom) setInspiFrom(pattern.inspi);
  }, [weekSlot, computed, post]); // eslint-disable-line

  const fetchPreview = async (urlToFetch: string) => {
    if (!urlToFetch.startsWith("http")) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(urlToFetch)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as PreviewData;
      setPreview(data);
      if (data.title && !title) setTitle(data.title.slice(0, 120));
      if (data.description && !caption) setCaption(data.description);
      if (data.format && data.format !== "OTHER") setFormat(data.format as ContentFormat);
      toast.success("Aperçu chargé");
    } catch (err) {
      toast.error("Impossible de charger l'aperçu", {
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
    if (computed) {
      const slotInfo = WEEK_SLOTS[slot];
      const baseDate = scheduledFor ? new Date(scheduledFor) : new Date();
      // Find the right date for this slot
      const day = baseDate.getDay();
      const targetDay = slotInfo.dayIdx as number;
      const diff = targetDay - day;
      baseDate.setDate(baseDate.getDate() + diff);
      baseDate.setHours(slotInfo.hour, slotInfo.minute, 0, 0);
      setScheduledFor(baseDate.toISOString());
    }
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
        caption: caption.trim() || null,
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
        salve_number: computed?.salve ?? null,
        legion_number: computed?.legion ?? null,
        inspi_from: inspiFrom.trim() || null,
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
    } catch (err) {
      toast.error("Erreur");
      console.error(err);
    }
  };

  const handlePublish = async () => {
    if (!post) return;
    try {
      const updated = await publishPost(post.id);
      upsertPost(updated);
      toast.success("Marqué publié 🎉");
    } catch (err) {
      toast.error("Erreur");
      console.error(err);
    }
  };

  return (
    <Dialog open={editorOpen} onOpenChange={(o) => !o && closeEditor()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="flex flex-col max-h-[92vh]">
          <DialogHeader className="p-5 pb-3 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap">
              {computed && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  Légion {computed.legion} · Salve {computed.salve}
                </Badge>
              )}
              <Badge variant={contentType.toLowerCase() as never}>
                {CONTENT_TYPES[contentType].emoji} {CONTENT_TYPES[contentType].label}
              </Badge>
              {weekSlot && (
                <Badge variant="secondary" className="text-[10px]">
                  {WEEK_SLOTS[weekSlot].shortLabel}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-lg mt-2">
              {post ? "Modifier" : "Ajouter au calendrier"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* URL field */}
            <div className="space-y-1.5">
              <Label htmlFor="url" className="flex items-center gap-1.5">
                <LinkIcon className="size-3.5" /> URL Instagram (référence ou ta vidéo publiée)
              </Label>
              <div className="relative">
                <Input
                  id="url"
                  type="url"
                  placeholder="Colle l'URL : reel d'inspi ou ta vidéo une fois publiée"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onPaste={handleUrlPaste}
                  onBlur={handleUrlBlur}
                  className="pr-20"
                  autoFocus={!post}
                />
                {loadingPreview && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                )}
                {url && !loadingPreview && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                    onClick={() => fetchPreview(url)}
                  >
                    <Sparkles className="size-3" /> Analyser
                  </Button>
                )}
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div className="rounded-lg border border-border overflow-hidden bg-muted/20">
                {preview.image && (
                  <div className="relative aspect-[1.91/1] w-full bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview.image}
                      alt={preview.title ?? ""}
                      className="absolute inset-0 size-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <Badge className={cn("absolute top-2 left-2", `bg-${CONTENT_TYPES[contentType].color}`, "text-white")}>
                      {FORMATS[format].emoji} {FORMATS[format].label}
                    </Badge>
                  </div>
                )}
                <div className="p-3 space-y-1">
                  {preview.title && <p className="font-medium text-sm line-clamp-1">{preview.title}</p>}
                  {preview.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{preview.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Slot Salve recommendation */}
            {weekSlot && computed && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="text-xs font-medium text-primary mb-1">
                  📋 Pattern Salve {computed.salve} · {WEEK_SLOTS[weekSlot].label}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>{SALVE_PATTERNS[computed.salve][weekSlot].concept}</strong> · inspi : {SALVE_PATTERNS[computed.salve][weekSlot].inspi}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Rôle : {CONTENT_TYPES[contentType].role}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Titre / concept</Label>
              <Input
                id="title"
                placeholder="Ex: Boom Figma — démo du gradient mesh"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Slot semaine</Label>
                <Select value={weekSlot ?? ""} onValueChange={(v) => handleSlotChange(v as WeekSlot)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choisir le slot" /></SelectTrigger>
                  <SelectContent>
                    {WEEK_SLOTS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>{WEEK_SLOTS[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type Bara</Label>
                <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CONTENT_TYPES) as ContentType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {CONTENT_TYPES[t].emoji} {CONTENT_TYPES[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as ContentFormat)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FORMATS) as ContentFormat[]).map((f) => (
                      <SelectItem key={f} value={f}>{FORMATS[f].emoji} {FORMATS[f].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Statut</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUSES) as ContentStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUSES[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
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
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Inspiré de</Label>
              <Input
                placeholder="Ex: Ioannis, Samx, sebastiangohan…"
                value={inspiFrom}
                onChange={(e) => setInspiFrom(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {(caption || preview?.description) && (
              <div className="space-y-1">
                <Label htmlFor="caption" className="text-xs">Caption / Notes</Label>
                <Textarea
                  id="caption"
                  placeholder="Caption ou notes libres"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
            )}

            {/* Métriques pour posts publiés */}
            {(status === "PUBLISHED" || views || likes || comments || saves) && (
              <div className="rounded-lg bg-muted/40 p-3 space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <TrendingUp className="size-3.5" /> Résultats
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <MetricInput icon={Eye} label="Vues" value={views} onChange={setViews} />
                  <MetricInput icon={Heart} label="Likes" value={likes} onChange={setLikes} />
                  <MetricInput icon={MessageCircle} label="Comm." value={comments} onChange={setComments} />
                  <MetricInput icon={Bookmark} label="Saves" value={saves} onChange={setSaves} />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-3 flex gap-2 items-center">
            {post && (
              <Button type="button" variant="ghost" size="sm" onClick={handleDelete} className="text-destructive">
                <Trash2 className="size-3.5" />
              </Button>
            )}
            {post && status !== "PUBLISHED" && (
              <Button type="button" variant="outline" size="sm" onClick={handlePublish}>
                Publié ✓
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="outline" size="sm" onClick={closeEditor}>
              <X className="size-3.5" /> Annuler
            </Button>
            <Button type="button" variant="gradient" size="sm" onClick={onSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
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
        className="h-8 text-xs"
      />
    </div>
  );
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
