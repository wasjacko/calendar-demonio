"use client";

import * as React from "react";
import { Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/lib/store";
import { createPost } from "@/lib/posts";
import { CONTENT_TYPES, type ContentType, type OgData } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AddVideoForm() {
  const { upsertPost } = useDataStore();
  const urlRef = React.useRef<HTMLInputElement>(null);

  const [url, setUrl] = React.useState("");
  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [preview, setPreview] = React.useState<OgData | null>(null);
  const [category, setCategory] = React.useState<ContentType | null>(null);
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const fetchPreview = async (u: string) => {
    if (!u.startsWith("http")) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(u)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as OgData;
      setPreview(data);
    } catch {
      toast.error("Aperçu indisponible");
    } finally {
      setLoadingPreview(false);
    }
  };

  const onPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (pasted.startsWith("http")) {
      setUrl(pasted);
      setTimeout(() => fetchPreview(pasted), 100);
    }
  };

  const onBlur = () => {
    if (url && url.startsWith("http") && !preview) fetchPreview(url);
  };

  const reset = () => {
    setUrl("");
    setPreview(null);
    setCategory(null);
    setNotes("");
    urlRef.current?.focus();
  };

  const canSave = (url.trim() !== "" || notes.trim() !== "") && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      // Auto title : preview > première ligne notes > "Sans titre"
      const autoTitle =
        preview?.title?.trim() ||
        notes.split("\n")[0].slice(0, 80).trim() ||
        "Sans titre";

      const created = await createPost({
        title: autoTitle,
        notes: notes.trim() || null,
        format: "REEL",
        content_type: category,
        status: "IDEA",
        source_url: url.trim() || null,
        og_data: preview,
        visual_url: preview?.image ?? null,
        hashtags: preview?.hashtags ?? [],
      });
      upsertPost(created);
      toast.success("Vidéo ajoutée au pool");
      reset();
    } catch (err) {
      toast.error("Erreur", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="add-video" className="rounded-lg border border-border bg-card/95 backdrop-blur-md p-5 space-y-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
        Ajouter
      </p>

      {/* URL input — minimal */}
      <input
        ref={urlRef}
        type="url"
        placeholder="Colle un lien Instagram…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onPaste={onPaste}
        onBlur={onBlur}
        className="w-full bg-transparent border-0 border-b border-border py-2 text-base sm:text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground transition-colors"
      />

      {/* Loader */}
      {loadingPreview && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="size-3 animate-spin" /> Analyse de l&apos;URL…
        </p>
      )}

      {/* Preview (Notion-style block) */}
      {preview && !loadingPreview && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl bg-muted/40 p-3 hover:bg-muted/60 transition-colors"
        >
          <div className="flex gap-3">
            {preview.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.image}
                alt=""
                className="size-16 sm:size-20 rounded-md object-cover shrink-0 bg-muted"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
              />
            )}
            <div className="flex-1 min-w-0 space-y-0.5">
              {preview.title && <p className="text-sm font-medium line-clamp-1">{preview.title}</p>}
              {preview.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{preview.description}</p>
              )}
              {preview.site_name && (
                <p className="text-[10px] text-muted-foreground/70 mt-1">{preview.site_name}</p>
              )}
            </div>
          </div>
        </a>
      )}

      {/* Catégorie pills */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">Catégorie</p>
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

      {/* Notes — minimal */}
      <textarea
        placeholder="Notes (facultatif)…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full bg-transparent border-0 py-1 text-sm placeholder:text-muted-foreground/70 focus:outline-none resize-none"
      />

      {/* Action */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          variant="default"
          onClick={onSave}
          disabled={!canSave}
          className="h-10"
        >
          {saving ? (
            <><Loader2 className="size-4 animate-spin" /> Ajout…</>
          ) : (
            <><Check className="size-4" /> Ajouter au pool</>
          )}
        </Button>
        {(url || preview || category || notes) && !saving && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Effacer
          </button>
        )}
      </div>
    </div>
  );
}
