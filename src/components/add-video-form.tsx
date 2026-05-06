"use client";

import * as React from "react";
import { Loader2, Check, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/lib/store";
import { createPost } from "@/lib/posts";
import { CONTENT_TYPES, type ContentType, type OgData } from "@/lib/types";
import { useDraft } from "@/lib/use-draft";
import { cn } from "@/lib/utils";

type Draft = {
  url: string;
  category: ContentType | null;
  notes: string;
  preview: OgData | null;
};

const INITIAL_DRAFT: Draft = {
  url: "",
  category: null,
  notes: "",
  preview: null,
};

export function AddVideoForm() {
  const { upsertPost } = useDataStore();
  const urlRef = React.useRef<HTMLInputElement>(null);

  const {
    value: draft,
    setValue: setDraft,
    clear: clearDraft,
  } = useDraft<Draft>("add-video-form", INITIAL_DRAFT);

  const { url, category, notes, preview } = draft;

  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const setUrl = (v: string) => setDraft((d) => ({ ...d, url: v }));
  const setCategory = (v: ContentType | null) =>
    setDraft((d) => ({ ...d, category: v }));
  const setNotes = (v: string) => setDraft((d) => ({ ...d, notes: v }));

  const fetchPreview = async (u: string) => {
    if (!u.startsWith("http")) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(u)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as OgData;
      setDraft((prev) => ({ ...prev, preview: data }));
    } catch {
      toast.error("Aperçu indisponible");
    } finally {
      setLoadingPreview(false);
    }
  };

  const onPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (pasted.startsWith("http")) {
      setDraft((prev) => ({ ...prev, url: pasted }));
      setTimeout(() => fetchPreview(pasted), 100);
    }
  };

  const onBlur = () => {
    if (url && url.startsWith("http") && !preview) fetchPreview(url);
  };

  const reset = () => {
    clearDraft();
    urlRef.current?.focus();
  };

  const clearUrl = () => {
    setDraft((d) => ({ ...d, url: "", preview: null }));
    urlRef.current?.focus();
  };

  const canSave = (url.trim() !== "" || notes.trim() !== "") && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
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
      clearDraft();
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const hasContent = !!(url || preview || category || notes);

  return (
    <div id="add-video" className="space-y-3">
      {/* BLOC 1 — Lien (séparé, focus visuel sur l'action principale) */}
      <div className="rounded-[28px] border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Lien
          </p>
          {hasContent && !saving && (
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Effacer
            </button>
          )}
        </div>

        <div className="relative">
          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            ref={urlRef}
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Colle un lien Instagram, TikTok, YouTube…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={onPaste}
            onBlur={onBlur}
            className="w-full h-12 pl-11 pr-11 rounded-2xl bg-muted/50 border border-transparent text-base sm:text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:bg-background focus:border-foreground/30 transition-colors"
          />
          {url && (
            <button
              type="button"
              onClick={clearUrl}
              aria-label="Effacer l'URL"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-7 rounded-full bg-muted-foreground/10 hover:bg-muted-foreground/20 flex items-center justify-center"
            >
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {loadingPreview && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
            <Loader2 className="size-3 animate-spin" /> Aperçu en cours…
          </p>
        )}

        {preview && !loadingPreview && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl bg-muted/40 p-3 hover:bg-muted/60 transition-colors"
          >
            <div className="flex gap-3">
              {preview.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.image}
                  alt=""
                  className="size-16 sm:size-20 rounded-xl object-cover shrink-0 bg-muted"
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.display = "none")
                  }
                />
              )}
              <div className="flex-1 min-w-0 space-y-0.5">
                {preview.title && (
                  <p className="text-sm font-medium line-clamp-1">
                    {preview.title}
                  </p>
                )}
                {preview.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {preview.description}
                  </p>
                )}
                {preview.site_name && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {preview.site_name}
                  </p>
                )}
              </div>
            </div>
          </a>
        )}
      </div>

      {/* BLOC 2 — Détails + action */}
      <div className="rounded-[28px] border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        {/* Alter */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
            Alter
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(CONTENT_TYPES) as ContentType[]).map((t) => {
              const isActive = category === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCategory(isActive ? null : t)}
                  className={cn(
                    "px-3 py-2 rounded-full text-xs transition-all flex items-center gap-1.5 border",
                    isActive
                      ? "bg-foreground text-background font-semibold border-foreground shadow-md scale-[1.02]"
                      : "bg-muted/50 text-foreground font-medium border-transparent hover:bg-accent"
                  )}
                >
                  {isActive && <Check className="size-3 -ml-0.5" strokeWidth={3} />}
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      `bg-${CONTENT_TYPES[t].color}`,
                      isActive && "ring-2 ring-background"
                    )}
                  />
                  {CONTENT_TYPES[t].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
            Notes
          </p>
          <textarea
            placeholder="Notes (facultatif)…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-2xl bg-muted/50 border border-transparent px-4 py-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:bg-background focus:border-foreground/30 transition-colors resize-none"
          />
        </div>

        {/* CTA */}
        <Button
          type="button"
          variant="default"
          onClick={onSave}
          disabled={!canSave}
          className="w-full h-12 text-base font-semibold rounded-2xl"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Ajout…
            </>
          ) : (
            <>
              <Check className="size-4" /> Ajouter au pool
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
