"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
  Sparkles,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  ExternalLink,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { useDataStore, useUIStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CONTENT_TYPES,
  WEEK_SLOTS,
  WEEK_SLOTS_ORDER,
  SALVE_PATTERNS,
  FORMATS,
  STATUSES,
  getLegionAndSalve,
  getDateForSlot,
  type Post,
  type WeekSlot,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const SALVE_NARRATIVE: Record<1 | 2 | 3, { title: string; goal: string; tactic: string; tone: string }> = {
  1: {
    title: "Bootstrap",
    goal: "Planter les graines : qui je suis, ce que je crois, ce que je sais",
    tactic: "Personal branding clivant + tip technique + B-Roll cinéma + story d'évolution",
    tone: "Tu poses tes piliers et tu attires l'attention. C'est l'introduction.",
  },
  2: {
    title: "Authority Stacking",
    goal: "Empiler les preuves d'expertise et solidifier le lien émotionnel",
    tactic: "BOOM viral pour scaler + méthode dévoilée + script attachement à CTA",
    tone: "Tu enfonces le clou et tu commences à tease la conversion.",
  },
  3: {
    title: "Conversion Window",
    goal: "Transformer l'attention accumulée en achats",
    tactic: "BOOM Portfolio (preuve sociale) + Tryhard B-Roll (qualité visible) + VALEUR donnée gratos vendredi (réciprocité) + boucle finale dimanche",
    tone: "Vendredi devient VALEUR au lieu d'AUDIENCE — c'est ta fenêtre de conversion. Tu donnes du gratuit qui aurait pu être payant pour déclencher l'achat.",
  },
};

export default function StrategyPage() {
  const { posts, loading } = useDataStore();
  const { openEditor } = useUIStore();
  const today = React.useMemo(() => new Date(), []);
  const currentInfo = React.useMemo(() => getLegionAndSalve(today), [today]);
  const [legion, setLegion] = React.useState(currentInfo.legion);

  const postsBySlot = React.useMemo(() => {
    const map = new Map<string, Post>();
    posts.forEach((p) => {
      if (p.legion_number && p.salve_number && p.week_slot) {
        map.set(`${p.legion_number}-${p.salve_number}-${p.week_slot}`, p);
      }
    });
    return map;
  }, [posts]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="size-6" /> Salves d&apos;ascension — Légion {legion}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          3 semaines × 5 vidéos = 15 posts orchestrés pour convertir l&apos;attention en clients.
        </p>
      </div>

      {/* Légion navigation */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLegion((l) => Math.max(1, l - 1))} disabled={legion === 1}>
            <ChevronLeft className="size-4" />
          </Button>
          <Badge variant="default" className="text-sm px-3 py-1">Légion {legion}</Badge>
          <Button variant="outline" size="sm" onClick={() => setLegion((l) => l + 1)}>
            <ChevronRight className="size-4" />
          </Button>
          {legion !== currentInfo.legion && (
            <Button variant="ghost" size="sm" onClick={() => setLegion(currentInfo.legion)}>
              Aujourd&apos;hui (Légion {currentInfo.legion})
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          On est actuellement <strong>Légion {currentInfo.legion} · Salve {currentInfo.salve}</strong>
        </p>
      </div>

      {/* Conversion strategy */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Stratégie de conversion
          </CardTitle>
          <CardDescription>
            Le triptyque <strong>Audience → Expertise → Attachement</strong> active 3 leviers psychologiques différents.
            Chaque salve a un rôle dans le tunnel.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {([1, 2, 3] as const).map((s) => (
            <div
              key={s}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                currentInfo.salve === s && legion === currentInfo.legion
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <p className="text-xs uppercase tracking-wide font-bold text-muted-foreground">Salve {s}</p>
              <p className="font-semibold text-sm">{SALVE_NARRATIVE[s].title}</p>
              <p className="text-xs text-muted-foreground mt-1">{SALVE_NARRATIVE[s].goal}</p>
              <p className="text-[11px] text-muted-foreground mt-2 italic">{SALVE_NARRATIVE[s].tone}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Salves grid */}
      {loading ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Chargement…</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {([1, 2, 3] as const).map((salveNum) => (
            <SalveBlock
              key={salveNum}
              legion={legion}
              salve={salveNum}
              postsBySlot={postsBySlot}
              onAdd={(slot, date) => openEditor(null, date.toISOString())}
              onEdit={(id) => openEditor(id)}
              isCurrent={currentInfo.salve === salveNum && legion === currentInfo.legion}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SalveBlock({
  legion,
  salve,
  postsBySlot,
  onAdd,
  onEdit,
  isCurrent,
}: {
  legion: number;
  salve: 1 | 2 | 3;
  postsBySlot: Map<string, Post>;
  onAdd: (slot: WeekSlot, date: Date) => void;
  onEdit: (id: string) => void;
  isCurrent: boolean;
}) {
  const filled = WEEK_SLOTS_ORDER.filter((s) => postsBySlot.has(`${legion}-${salve}-${s}`)).length;

  return (
    <Card className={cn(isCurrent && "ring-2 ring-primary")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              Salve {salve} · {SALVE_NARRATIVE[salve].title}
              {isCurrent && <Badge variant="default" className="text-[10px]">EN COURS</Badge>}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">{SALVE_NARRATIVE[salve].tactic}</CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {filled}/5 posts
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {WEEK_SLOTS_ORDER.map((slot) => {
            const pattern = SALVE_PATTERNS[salve][slot];
            const post = postsBySlot.get(`${legion}-${salve}-${slot}`);
            return (
              <SlotCell
                key={slot}
                slot={slot}
                pattern={pattern}
                post={post}
                onAdd={() => onAdd(slot, getDateForSlot(legion, salve, slot))}
                onEdit={() => post && onEdit(post.id)}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SlotCell({
  slot,
  pattern,
  post,
  onAdd,
  onEdit,
}: {
  slot: WeekSlot;
  pattern: { type: import("@/lib/types").ContentType; concept: string; inspi: string };
  post: Post | undefined;
  onAdd: () => void;
  onEdit: () => void;
}) {
  const slotInfo = WEEK_SLOTS[slot];
  const typeInfo = CONTENT_TYPES[pattern.type];

  if (!post) {
    return (
      <button
        onClick={onAdd}
        className="text-left rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-accent/30 transition-colors p-3 group min-h-[120px] flex flex-col"
      >
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">{slotInfo.shortLabel}</p>
        <Badge variant={pattern.type.toLowerCase() as never} className="self-start mt-1 text-[10px]">
          {typeInfo.emoji} {typeInfo.label}
        </Badge>
        <p className="text-xs font-medium mt-2 line-clamp-2">{pattern.concept}</p>
        <p className="text-[10px] text-muted-foreground mt-auto pt-2">inspi : {pattern.inspi}</p>
        <Plus className="size-4 mx-auto mt-1 text-muted-foreground group-hover:text-primary" />
      </button>
    );
  }

  const perf = post.performance ?? {};
  const totalEngagement = (perf.likes ?? 0) + (perf.comments ?? 0) + (perf.saves ?? 0);

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary transition-all min-h-[120px] flex flex-col group",
        post.status === "PUBLISHED" && "border-status-published/40"
      )}
    >
      <button onClick={onEdit} className="text-left flex-1 flex flex-col">
        {post.visual_url ? (
          <div className="relative aspect-square bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.visual_url}
              alt=""
              className="absolute inset-0 size-full object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
            <Badge className={cn("absolute top-1 left-1 text-[9px]", `bg-${typeInfo.color} text-white`)}>
              {typeInfo.emoji}
            </Badge>
            <Badge variant={post.status.toLowerCase() as never} className="absolute top-1 right-1 text-[9px]">
              {STATUSES[post.status].label}
            </Badge>
          </div>
        ) : (
          <div className={cn("aspect-square flex items-center justify-center bg-muted/30", `text-${typeInfo.color}`)}>
            <span className="text-3xl">{FORMATS[post.format].emoji}</span>
          </div>
        )}
        <div className="p-2 flex-1 flex flex-col">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
            {slotInfo.shortLabel}
          </p>
          <p className="text-xs font-medium line-clamp-2 mt-0.5">{post.title}</p>
          {post.status === "PUBLISHED" && (perf.views || totalEngagement > 0) && (
            <div className="mt-auto pt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
              {perf.views !== undefined && (
                <span className="flex items-center gap-0.5"><Eye className="size-2.5" /> {formatNumber(perf.views)}</span>
              )}
              {perf.likes !== undefined && (
                <span className="flex items-center gap-0.5"><Heart className="size-2.5" /> {formatNumber(perf.likes)}</span>
              )}
              {perf.comments !== undefined && (
                <span className="flex items-center gap-0.5"><MessageCircle className="size-2.5" /> {formatNumber(perf.comments)}</span>
              )}
              {perf.saves !== undefined && (
                <span className="flex items-center gap-0.5"><Bookmark className="size-2.5" /> {formatNumber(perf.saves)}</span>
              )}
            </div>
          )}
        </div>
      </button>
      {post.source_url && (
        <div className="absolute bottom-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <CopyButton value={post.source_url} className="bg-background/90 backdrop-blur-sm rounded shadow-sm" size="xs" />
          <a
            href={post.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="bg-background/90 backdrop-blur-sm rounded shadow-sm p-1 text-muted-foreground hover:text-foreground"
            title="Ouvrir l'URL"
          >
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}
    </div>
  );
}

function formatNumber(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 1 : 0) + "k";
  return (n / 1_000_000).toFixed(1) + "M";
}
