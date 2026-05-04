"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Sparkles,
  Trash2,
  Calendar as CalendarIcon,
  Hash,
  ImageIcon,
  Music,
  Wand2,
  CheckCircle2,
  Save,
  Send,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUIStore, useDataStore } from "@/lib/store";
import { createPost, updatePost, deletePost, publishPost } from "@/lib/posts";
import {
  FUNNEL_STAGES,
  FORMATS,
  STATUSES,
  PILLARS,
  type FunnelStage,
  type ContentFormat,
  type ContentStatus,
  type ContentPillar,
  type Template,
  type Post,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "Titre requis").max(120),
  hook: z.string().max(280).nullable().optional(),
  caption: z.string().max(2200).nullable().optional(),
  hashtags_str: z.string().max(500).optional(),
  cta: z.string().max(280).nullable().optional(),
  visual_brief: z.string().max(500).nullable().optional(),
  visual_url: z.string().url().or(z.literal("")).nullable().optional(),
  audio_reference: z.string().max(280).nullable().optional(),
  format: z.enum(["REEL", "POST", "CAROUSEL", "STORY", "LIVE"]),
  funnel_stage: z.enum(["TOFU", "MOFU", "BOFU"]),
  pillar: z.enum(["EDUCATION", "INSPIRATION", "TESTIMONIAL", "BTS", "PROMO", "ENGAGEMENT", "STORYTELLING", "AUTHORITY"]).nullable().optional(),
  status: z.enum(["IDEA", "DRAFT", "SCHEDULED", "PUBLISHED", "MISSED"]),
  scheduled_for: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function PostEditor() {
  const { editorOpen, editorPostId, selectedDate, closeEditor } = useUIStore();
  const { posts, templates, upsertPost, removePost } = useDataStore();
  const post = React.useMemo(() => posts.find((p) => p.id === editorPostId) ?? null, [posts, editorPostId]);

  const [tab, setTab] = React.useState("content");
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaults(post, selectedDate),
  });

  React.useEffect(() => {
    if (editorOpen) {
      form.reset(getDefaults(post, selectedDate));
      setTab("content");
    }
  }, [editorOpen, post, selectedDate, form]);

  const funnelStage = form.watch("funnel_stage");
  const format = form.watch("format");
  const status = form.watch("status");
  const charCount = form.watch("caption")?.length ?? 0;
  const hashtagCount = (form.watch("hashtags_str") ?? "").split(/\s+/).filter((t) => t.startsWith("#")).length;

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const hashtags = (values.hashtags_str ?? "")
        .split(/\s+/)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean);

      const payload = {
        title: values.title,
        hook: values.hook || null,
        caption: values.caption || null,
        hashtags,
        cta: values.cta || null,
        visual_brief: values.visual_brief || null,
        visual_url: values.visual_url || null,
        audio_reference: values.audio_reference || null,
        format: values.format,
        funnel_stage: values.funnel_stage,
        pillar: values.pillar ?? null,
        status: values.status,
        scheduled_for: values.scheduled_for || null,
        notes: values.notes || null,
      };

      const saved = post
        ? await updatePost(post.id, payload)
        : await createPost(payload);

      upsertPost(saved);
      toast.success(post ? "Post mis à jour" : "Post créé", {
        description: saved.title,
      });
      closeEditor();
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde");
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
      toast.success("Post supprimé");
      closeEditor();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
      console.error(err);
    }
  };

  const handlePublish = async () => {
    if (!post) return;
    try {
      const updated = await publishPost(post.id);
      upsertPost(updated);
      toast.success("Marqué comme publié 🎉");
      closeEditor();
    } catch (err) {
      toast.error("Erreur");
      console.error(err);
    }
  };

  const applyTemplate = (template: Template) => {
    form.setValue("hook", template.hook_template);
    form.setValue("caption", template.caption_template);
    form.setValue("cta", template.cta_template);
    form.setValue("hashtags_str", template.hashtags.map((h) => `#${h}`).join(" "));
    form.setValue("visual_brief", template.visual_brief);
    form.setValue("format", template.format);
    form.setValue("funnel_stage", template.funnel_stage);
    if (template.pillar) form.setValue("pillar", template.pillar);
    toast.success(`Template "${template.name}" appliqué`);
    setTab("content");
  };

  const matchingTemplates = templates.filter((t) => t.format === format && t.funnel_stage === funnelStage);

  return (
    <Dialog open={editorOpen} onOpenChange={(o) => !o && closeEditor()}>
      <DialogContent className="max-w-3xl max-h-[92vh] p-0 overflow-hidden">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-[92vh]">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={funnelStage.toLowerCase() as never}>{funnelStage}</Badge>
              <Badge variant="outline">{FORMATS[format]?.emoji} {FORMATS[format]?.label}</Badge>
              <Badge variant={status.toLowerCase() as never}>{STATUSES[status].label}</Badge>
            </div>
            <DialogTitle className="text-xl mt-2">
              {post ? "Modifier le post" : "Nouveau post"}
            </DialogTitle>
            <DialogDescription>
              {FUNNEL_STAGES[funnelStage].description}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="content"><Sparkles className="size-3.5" /> Contenu</TabsTrigger>
                <TabsTrigger value="meta"><CalendarIcon className="size-3.5" /> Planning</TabsTrigger>
                <TabsTrigger value="visual"><ImageIcon className="size-3.5" /> Visuel</TabsTrigger>
                <TabsTrigger value="templates"><Wand2 className="size-3.5" /> Templates</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TabsContent value="content" className="space-y-4 m-0">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre interne *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Reel viral - mes 3 erreurs de débutant"
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={format} onValueChange={(v) => form.setValue("format", v as ContentFormat)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(FORMATS) as ContentFormat[]).map((f) => (
                          <SelectItem key={f} value={f}>
                            {FORMATS[f].emoji} {FORMATS[f].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Étape funnel</Label>
                    <Select value={funnelStage} onValueChange={(v) => form.setValue("funnel_stage", v as FunnelStage)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(FUNNEL_STAGES) as FunnelStage[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s} — {FUNNEL_STAGES[s].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pilier de contenu</Label>
                  <Select
                    value={form.watch("pillar") ?? "none"}
                    onValueChange={(v) => form.setValue("pillar", v === "none" ? null : (v as ContentPillar))}
                  >
                    <SelectTrigger><SelectValue placeholder="Aucun pilier" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Aucun —</SelectItem>
                      {(Object.keys(PILLARS) as ContentPillar[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          {PILLARS[p].emoji} {PILLARS[p].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="hook">
                    Hook
                    <span className="text-xs text-muted-foreground ml-2">3 premières secondes — l&apos;arme la plus importante</span>
                  </Label>
                  <Textarea
                    id="hook"
                    placeholder="La phrase qui arrête le scroll. Ex: 'La vérité sur [sujet] que personne n'ose dire'"
                    rows={2}
                    {...form.register("hook")}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="caption">Caption</Label>
                    <span className={cn("text-xs", charCount > 2200 ? "text-destructive" : "text-muted-foreground")}>
                      {charCount}/2200
                    </span>
                  </div>
                  <Textarea
                    id="caption"
                    placeholder="Le texte complet du post. Storytelling, valeur, CTA..."
                    rows={6}
                    {...form.register("caption")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cta">
                    Call-to-action
                    {funnelStage === "BOFU" && (
                      <Badge variant="bofu" className="ml-2">Doit pointer vers SKOOL</Badge>
                    )}
                  </Label>
                  <Input
                    id="cta"
                    placeholder={
                      funnelStage === "BOFU"
                        ? "Rejoins la communauté SKOOL → lien en bio"
                        : funnelStage === "MOFU"
                        ? "Sauvegarde ce post pour le relire"
                        : "Commente ton avis pour qu'on en discute"
                    }
                    {...form.register("cta")}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hashtags_str">
                      <Hash className="size-3.5 inline mr-1" />Hashtags
                    </Label>
                    <span className={cn("text-xs", hashtagCount > 30 ? "text-destructive" : "text-muted-foreground")}>
                      {hashtagCount}/30
                    </span>
                  </div>
                  <Textarea
                    id="hashtags_str"
                    placeholder="#mindset #entrepreneuriat #freelance"
                    rows={2}
                    {...form.register("hashtags_str")}
                  />
                </div>
              </TabsContent>

              <TabsContent value="meta" className="space-y-4 m-0">
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={status} onValueChange={(v) => form.setValue("status", v as ContentStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUSES) as ContentStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{STATUSES[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_for">Date & heure de publication</Label>
                  <Input
                    id="scheduled_for"
                    type="datetime-local"
                    value={
                      form.watch("scheduled_for")
                        ? toLocalDatetime(form.watch("scheduled_for")!)
                        : ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      form.setValue("scheduled_for", v ? new Date(v).toISOString() : null);
                      if (v && status === "IDEA") form.setValue("status", "SCHEDULED");
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Heures de pic Instagram : 7h-9h (matin), 12h-14h (midi), 19h-21h (soir).
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes internes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Idées, références, sources, deadlines..."
                    rows={4}
                    {...form.register("notes")}
                  />
                </div>
              </TabsContent>

              <TabsContent value="visual" className="space-y-4 m-0">
                <div className="space-y-2">
                  <Label htmlFor="visual_brief">Brief visuel</Label>
                  <Textarea
                    id="visual_brief"
                    placeholder="Décris la composition, la lumière, le mouvement, les transitions, la typo..."
                    rows={5}
                    {...form.register("visual_brief")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visual_url">URL du visuel (optionnel)</Label>
                  <Input
                    id="visual_url"
                    type="url"
                    placeholder="https://..."
                    {...form.register("visual_url")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audio_reference">
                    <Music className="size-3.5 inline mr-1" />Audio / Trend
                  </Label>
                  <Input
                    id="audio_reference"
                    placeholder="Ex: 'sound name' - artist OU lien Reel inspirant"
                    {...form.register("audio_reference")}
                  />
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-3 m-0">
                <div className="rounded-lg bg-muted/40 p-3 text-sm">
                  <p className="font-medium mb-1">Templates pour {FORMATS[format].emoji} {FORMATS[format].label} · {funnelStage}</p>
                  <p className="text-xs text-muted-foreground">
                    Clique pour appliquer le template au post. Tu pourras ensuite personnaliser.
                  </p>
                </div>

                {matchingTemplates.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Aucun template pour cette combinaison. Change le format ou l&apos;étape funnel.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {matchingTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="w-full text-left rounded-lg border border-border bg-card hover:bg-accent transition-colors p-3 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{t.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.hook_template}</p>
                          </div>
                          {t.pillar && (
                            <Badge variant="outline" className="shrink-0">{PILLARS[t.pillar].emoji}</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <div className="border-t border-border p-4 flex flex-col-reverse sm:flex-row gap-2">
            {post && (
              <Button type="button" variant="ghost" size="sm" onClick={handleDelete} className="text-destructive">
                <Trash2 className="size-4" /> Supprimer
              </Button>
            )}
            <div className="flex-1" />
            {post && status !== "PUBLISHED" && (
              <Button type="button" variant="outline" onClick={handlePublish}>
                <CheckCircle2 className="size-4" /> Marquer publié
              </Button>
            )}
            <Button type="button" variant="outline" onClick={closeEditor}>Annuler</Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? <><Save className="size-4 animate-pulse" /> Sauvegarde...</> : <><Send className="size-4" /> {post ? "Mettre à jour" : "Créer"}</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getDefaults(post: Post | null, selectedDate: string | null): FormValues {
  if (post) {
    return {
      title: post.title,
      hook: post.hook,
      caption: post.caption,
      hashtags_str: post.hashtags.map((h) => `#${h}`).join(" "),
      cta: post.cta,
      visual_brief: post.visual_brief,
      visual_url: post.visual_url ?? "",
      audio_reference: post.audio_reference,
      format: post.format,
      funnel_stage: post.funnel_stage,
      pillar: post.pillar,
      status: post.status,
      scheduled_for: post.scheduled_for,
      notes: post.notes,
    };
  }
  return {
    title: "",
    hook: "",
    caption: "",
    hashtags_str: "",
    cta: "",
    visual_brief: "",
    visual_url: "",
    audio_reference: "",
    format: "REEL",
    funnel_stage: "TOFU",
    pillar: null,
    status: selectedDate ? "SCHEDULED" : "IDEA",
    scheduled_for: selectedDate,
    notes: "",
  };
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
