"use client";

import * as React from "react";
import Image from "next/image";
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
  FUNNEL_STAGES,
  FORMATS,
  STATUSES,
  type FunnelStage,
  type ContentFormat,
  type ContentStatus,
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
  const [funnelStage, setFunnelStage] = React.useState<FunnelStage>("TOFU");
  const [format, setFormat] = React.useState<ContentFormat>("REEL");
  const [status, setStatus] = React.useState<ContentStatus>("IDEA");
  const [scheduledFor, setScheduledFor] = React.useState<string | null>(null);

  const [views, setViews] = React.useState("");
  const [likes, setLikes] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [saves, setSaves] = React.useState("");

  React.useEffect(() => {
    if (!editorOpen) return;
    if (post) {
      setUrl(post.source_url ?? "");
      setTitle(post.title);
      setCaption(post.caption ?? "");
      setFunnelStage(post.funnel_stage);
      setFormat(post.format);
      setStatus(post.status);
      setScheduledFor(post.scheduled_for);
      const perf = post.performance ?? {};
      setViews(perf.views?.toString() ?? "");
      setLikes(perf.likes?.toString() ?? "");
      setComments(perf.comments?.toString() ?? "");
      setSaves(perf.saves?.toString() ?? "");
      const ogData = (post as Post & { og_data?: PreviewData }).og_data;
      if (ogData) setPreview(ogData);
      else setPreview(null);
    } else {
      setUrl("");
      setTitle("");
      setCaption("");
      setFunnelStage("TOFU");
      setFormat("REEL");
      setStatus(selectedDate ? "SCHEDULED" : "IDEA");
      setScheduledFor(selectedDate);
      setViews("");
      setLikes("");
      setComments("");
      setSaves("");
      setPreview(null);
    }
  }, [editorOpen, post, selectedDate]);

  const fetchPreview = async (urlToFetch: string) => {
    if (!urlToFetch.startsWith("http")) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(urlToFetch)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as PreviewData;
      setPreview(data);
      // Auto-fill fields from preview
      if (data.title && !title) setTitle(data.title.slice(0, 120));
      if (data.description && !caption) setCaption(data.description);
      if (data.format && data.format !== "OTHER") setFormat(data.format as ContentFormat);
      toast.success("Aperçu chargé", { description: data.site_name ?? "URL analysée" });
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
    if (url && url.startsWith("http") && !preview) {
      fetchPreview(url);
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
        funnel_stage: funnelStage,
        status,
        scheduled_for: scheduledFor,
        source_url: url.trim() || null,
        og_data: preview,
        visual_url: preview?.image ?? null,
        hashtags: preview?.hashtags ?? [],
        performance: hasPerformance ? performance : null,
      };

      const saved = post ? await updatePost(post.id, payload as never) : await createPost(payload as never);
      upsertPost(saved);
      toast.success(post ? "Mis à jour" : "Ajouté au calendrier", { description: saved.title });
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
      toast.success("Marqué comme publié 🎉");
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
            <DialogTitle className="flex items-center gap-2 text-lg">
              {post ? "Modifier" : "Ajouter au calendrier"}
              {preview?.site_name && <Badge variant="outline" className="ml-auto text-[10px]">{preview.site_name}</Badge>}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* URL field — focal point */}
            <div className="space-y-1.5">
              <Label htmlFor="url" className="flex items-center gap-1.5">
                <LinkIcon className="size-3.5" /> URL Instagram (ou autre)
              </Label>
              <div className="relative">
                <Input
                  id="url"
                  type="url"
                  placeholder="Colle ici l'URL du Reel / Post / Carrousel..."
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
              <p className="text-[11px] text-muted-foreground">
                Colle ton URL → on extrait l&apos;image, le format, la caption automatiquement.
              </p>
            </div>

            {/* Preview card */}
            {preview && (
              <div className="rounded-lg border border-border overflow-hidden bg-muted/20">
                {preview.image && (
                  <div className="relative aspect-[1.91/1] w-full bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview.image}
                      alt={preview.title ?? "Aperçu"}
                      className="absolute inset-0 size-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <Badge className={cn("absolute top-2 left-2", `bg-${FUNNEL_STAGES[funnelStage].color} text-white`)}>
                      {FORMATS[format].emoji} {FORMATS[format].label}
                    </Badge>
                  </div>
                )}
                <div className="p-3 space-y-1">
                  {preview.title && <p className="font-medium text-sm line-clamp-1">{preview.title}</p>}
                  {preview.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{preview.description}</p>
                  )}
                  {preview.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {preview.hashtags.slice(0, 6).map((h) => (
                        <span key={h} className="text-[10px] text-primary">#{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Basic info — minimal */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                placeholder="Donne un nom à ce post"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
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
                <Label className="text-xs">Funnel</Label>
                <Select value={funnelStage} onValueChange={(v) => setFunnelStage(v as FunnelStage)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FUNNEL_STAGES) as FunnelStage[]).map((s) => (
                      <SelectItem key={s} value={s}>{s} — {FUNNEL_STAGES[s].label}</SelectItem>
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
            </div>

            <div className="space-y-1">
              <Label htmlFor="datetime" className="text-xs flex items-center gap-1">
                <CalendarIcon className="size-3" /> Date & heure de publication
              </Label>
              <Input
                id="datetime"
                type="datetime-local"
                value={scheduledFor ? toLocalDatetime(scheduledFor) : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setScheduledFor(v ? new Date(v).toISOString() : null);
                  if (v && status === "IDEA") setStatus("SCHEDULED");
                }}
              />
            </div>

            {(caption || preview?.description) && (
              <div className="space-y-1">
                <Label htmlFor="caption" className="text-xs">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Caption détectée ou personnalisée"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
            )}

            {/* Métriques — apparait pour Published / ou si déjà saisies */}
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
