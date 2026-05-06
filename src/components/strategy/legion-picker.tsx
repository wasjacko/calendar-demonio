"use client";

import * as React from "react";
import { Plus, Search, Loader2, Link2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataStore } from "@/lib/store";
import { createPost, updatePost } from "@/lib/posts";
import {
  CONTENT_TYPES,
  FORMATS,
  WEEK_SLOTS,
  type WeekSlot,
  type OgData,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Target = {
  legion: number;
  salve: 1 | 2 | 3;
  slot: WeekSlot;
};

export function LegionPicker({
  open,
  target,
  onClose,
  onAfterAssign,
}: {
  open: boolean;
  target: Target | null;
  onClose: () => void;
  /**
   * Appelé après assignation réussie avec l'ID de la vidéo nouvellement
   * placée dans le slot. Permet d'ouvrir directement la fiche d'état.
   */
  onAfterAssign?: (postId: string) => void;
}) {
  const { posts, upsertPost } = useDataStore();
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState<"pool" | "url">("pool");
  const [url, setUrl] = React.useState("");
  const [preview, setPreview] = React.useState<OgData | null>(null);
  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Pool = vidéos non assignées (ni à un week_slot, ni à une légion)
  const pool = React.useMemo(() => {
    return posts.filter((p) => !p.week_slot && !p.legion_number);
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
    if (!open) {
      setSearch("");
      setTab("pool");
      setUrl("");
      setPreview(null);
    }
  }, [open]);

  const fetchPreview = async (u: string) => {
    if (!u.startsWith("http")) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(u)}`);
      if (!res.ok) throw new Error(await res.text());
      setPreview((await res.json()) as OgData);
    } catch {
      toast.error("Aperçu indisponible");
    } finally {
      setLoadingPreview(false);
    }
  };

  const assignFromPool = async (postId: string) => {
    if (!target) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    try {
      const updated = await updatePost(post.id, {
        legion_number: target.legion,
        salve_number: target.salve,
        week_slot: target.slot,
        status: post.status === "IDEA" ? "SCHEDULED" : post.status,
        // Par défaut: nouvelle assignation = "À faire"
        inspi_status: post.inspi_status ?? "TODO",
      });
      upsertPost(updated);
      onClose();
      onAfterAssign?.(updated.id);
    } catch {
      toast.error("Erreur");
    }
  };

  const createFromUrl = async () => {
    if (!target || !url.trim()) return;
    setSaving(true);
    try {
      const autoTitle =
        preview?.title?.trim() || url.replace(/^https?:\/\//, "").slice(0, 60);
      const created = await createPost({
        title: autoTitle,
        format: "REEL",
        status: "SCHEDULED",
        source_url: url.trim(),
        og_data: preview,
        visual_url: preview?.image ?? null,
        hashtags: preview?.hashtags ?? [],
        legion_number: target.legion,
        salve_number: target.salve,
        week_slot: target.slot,
        inspi_status: "TODO",
      });
      upsertPost(created);
      onClose();
      onAfterAssign?.(created.id);
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const targetLabel = target
    ? `Salve ${target.legion} · Semaine ${target.salve} · ${WEEK_SLOTS[target.slot].shortLabel}`
    : "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="flex flex-col max-h-[90svh]">
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          <DialogHeader className="px-5 pt-3 sm:pt-5 pb-3 border-b border-border">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Choisir une vidéo
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{targetLabel}</p>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setTab("pool")}
              className={cn(
                "flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                tab === "pool"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground"
              )}
            >
              Du pool ({pool.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("url")}
              className={cn(
                "flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                tab === "url"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground"
              )}
            >
              Coller un lien
            </button>
          </div>

          {tab === "pool" ? (
            <>
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

              <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col min-h-[14rem]">
                {filtered.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center px-6">
                    <p className="text-sm text-muted-foreground text-center">
                      {pool.length === 0
                        ? "Pool vide. Colle un lien dans l'autre onglet."
                        : "Aucune vidéo trouvée."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filtered.map((video) => {
                      const typeInfo = video.content_type
                        ? CONTENT_TYPES[video.content_type]
                        : null;
                      return (
                        <button
                          key={video.id}
                          onClick={() => assignFromPool(video.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent transition-colors text-left active:scale-[0.99]"
                        >
                          {video.visual_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={video.visual_url}
                              alt=""
                              className="size-12 rounded-md object-cover shrink-0"
                              onError={(e) =>
                                ((e.currentTarget as HTMLImageElement).style.display =
                                  "none")
                              }
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
                            <p className="text-sm font-medium line-clamp-1">
                              {video.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {typeInfo && (
                                <span
                                  className={`size-1.5 rounded-full bg-${typeInfo.color}`}
                                />
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {typeInfo?.label ?? "—"} ·{" "}
                                {FORMATS[video.format].label}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="Colle un lien Instagram, TikTok, YouTube…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={() => url && !preview && fetchPreview(url)}
                  className="pl-10 h-12 rounded-2xl"
                />
              </div>

              {loadingPreview && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" /> Aperçu…
                </p>
              )}

              {preview && !loadingPreview && (
                <div className="rounded-xl bg-muted/40 p-3 flex gap-3">
                  {preview.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.image}
                      alt=""
                      className="size-16 rounded-md object-cover shrink-0 bg-muted"
                      onError={(e) =>
                        ((e.currentTarget as HTMLImageElement).style.display =
                          "none")
                      }
                    />
                  )}
                  <div className="flex-1 min-w-0">
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
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            className="p-3 border-t border-border bg-card"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {tab === "url" ? (
              <Button
                variant="default"
                className="w-full h-11 rounded-2xl font-semibold"
                onClick={createFromUrl}
                disabled={!url.trim() || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Ajout…
                  </>
                ) : (
                  <>
                    <Check className="size-4" /> Assigner ce lien
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full h-11 rounded-2xl"
                onClick={() => setTab("url")}
              >
                <Plus className="size-4" /> Coller un nouveau lien
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
