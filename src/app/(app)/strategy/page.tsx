"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDashed,
  CircleCheck,
  Plus,
} from "lucide-react";
import { useDataStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LegionPicker } from "@/components/strategy/legion-picker";
import { StateDialog } from "@/components/strategy/state-dialog";
import { useCurrentSalve } from "@/lib/use-current-salve";
import {
  CONTENT_TYPES,
  WEEK_SLOTS,
  WEEK_SLOTS_ORDER,
  SALVE_PATTERNS,
  FORMATS,
  type Post,
  type WeekSlot,
  type InspiStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export default function StrategyPage() {
  const { posts, loading } = useDataStore();
  const current = useCurrentSalve();
  const [legion, setLegion] = React.useState(current.legion);
  const [pickerTarget, setPickerTarget] = React.useState<{
    legion: number;
    salve: 1 | 2 | 3;
    slot: WeekSlot;
  } | null>(null);
  const [stateDialogPostId, setStateDialogPostId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLegion(current.legion);
  }, [current.legion]);

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
    <div className="px-4 sm:px-6 pt-10 sm:pt-12 pb-10 sm:pb-12 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Salve {legion}</h2>
          <p className="text-xs text-muted-foreground">3 semaines × 5 créneaux</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setLegion((l) => Math.max(1, l - 1))} disabled={legion === 1} className="size-9 px-0">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLegion((l) => l + 1)} className="size-9 px-0">
            <ChevronRight className="size-4" />
          </Button>
          {legion !== current.legion && (
            <Button variant="ghost" size="sm" onClick={() => setLegion(current.legion)} className="text-xs px-2 ml-1">
              Aujourd&apos;hui
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Chargement…</CardContent></Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {([1, 2, 3] as const).map((salveNum) => (
            <SalveBlock
              key={salveNum}
              legion={legion}
              salve={salveNum}
              postsBySlot={postsBySlot}
              onEdit={(id) => setStateDialogPostId(id)}
              onPickEmpty={(slot) => setPickerTarget({ legion, salve: salveNum, slot })}
            />
          ))}
        </div>
      )}

      <LegionPicker
        open={pickerTarget !== null}
        target={pickerTarget}
        onClose={() => setPickerTarget(null)}
        onAfterAssign={(postId) => setStateDialogPostId(postId)}
      />

      <StateDialog
        open={stateDialogPostId !== null}
        postId={stateDialogPostId}
        onClose={() => setStateDialogPostId(null)}
      />
    </div>
  );
}

function SalveBlock({
  legion,
  salve,
  postsBySlot,
  onEdit,
  onPickEmpty,
}: {
  legion: number;
  salve: 1 | 2 | 3;
  postsBySlot: Map<string, Post>;
  onEdit: (id: string) => void;
  onPickEmpty: (slot: WeekSlot) => void;
}) {
  const filled = WEEK_SLOTS_ORDER.filter((s) => postsBySlot.has(`${legion}-${salve}-${s}`)).length;

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm">Semaine {salve}</p>
          <Badge variant="outline" className="text-[10px]">{filled}/5</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {WEEK_SLOTS_ORDER.map((slot) => {
            const expectedType = SALVE_PATTERNS[salve][slot];
            const post = postsBySlot.get(`${legion}-${salve}-${slot}`);
            return (
              <SlotCell
                key={slot}
                slot={slot}
                expectedType={expectedType}
                post={post}
                onEdit={() => post && onEdit(post.id)}
                onPickEmpty={() => onPickEmpty(slot)}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Mappe l'état inspi vers les classes Tailwind appliquées à la carte entière
const STATE_CARD_STYLES: Record<InspiStatus, string> = {
  TODO: "bg-sky-50 border-sky-300",
  DOING: "bg-amber-50 border-amber-400",
  DONE: "bg-emerald-50 border-emerald-300",
};

function SlotCell({
  slot,
  expectedType,
  post,
  onEdit,
  onPickEmpty,
}: {
  slot: WeekSlot;
  expectedType: import("@/lib/types").ContentType;
  post: Post | undefined;
  onEdit: () => void;
  onPickEmpty: () => void;
}) {
  const slotInfo = WEEK_SLOTS[slot];
  const typeInfo = CONTENT_TYPES[expectedType];

  if (!post) {
    return (
      <button
        type="button"
        onClick={onPickEmpty}
        className="rounded-lg border border-dashed border-border p-3 min-h-[110px] flex flex-col bg-muted/20 text-left hover:border-foreground/40 hover:bg-accent/30 active:scale-[0.99] transition-all group"
      >
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">{slotInfo.shortLabel}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`size-2 rounded-full bg-${typeInfo.color}`} />
          <span className="text-xs text-muted-foreground">{typeInfo.label}</span>
        </div>
        <span className="mt-auto pt-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
          <Plus className="size-3" /> Choisir
        </span>
      </button>
    );
  }

  const typeForPost = post.content_type ? CONTENT_TYPES[post.content_type] : typeInfo;
  const inspi = post.inspi_status;
  const cardStyle = inspi ? STATE_CARD_STYLES[inspi] : "bg-card border-border";

  // Bandeau d'état: visible d'un coup d'œil, plein largeur, en haut de la carte
  const stateBand: Record<InspiStatus, { bg: string; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }> = {
    TODO: { bg: "bg-sky-500", label: "À faire", icon: Circle },
    DOING: { bg: "bg-amber-500", label: "En cours", icon: CircleDashed },
    DONE: { bg: "bg-emerald-500", label: "Fait", icon: CircleCheck },
  };
  const band = inspi ? stateBand[inspi] : null;
  const BandIcon = band?.icon;

  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        "relative rounded-lg overflow-hidden border transition-all min-h-[110px] flex flex-col group text-left active:scale-[0.99]",
        cardStyle
      )}
    >
      {/* BANDEAU D'ÉTAT — plein largeur, hyper visible.
          Si pas d'état: bandeau gris discret "Aucun état". */}
      {band && BandIcon ? (
        <div
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 text-white text-[11px] font-bold uppercase tracking-wider",
            band.bg
          )}
        >
          <BandIcon className="size-3.5" strokeWidth={2.5} />
          {band.label}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1.5 py-1.5 bg-muted text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
          Aucun état
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {post.visual_url ? (
          <div className="relative aspect-square bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.visual_url}
              alt=""
              className="absolute inset-0 size-full object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
            <div className={cn("absolute top-1 left-1 size-2.5 rounded-full ring-2 ring-white/80", `bg-${typeForPost.color}`)} />
          </div>
        ) : (
          <div className={cn("aspect-square flex items-center justify-center text-xs font-semibold", `bg-${typeForPost.color}/15 text-${typeForPost.color}`)}>
            {FORMATS[post.format].label}
          </div>
        )}
        <div className="p-2 flex-1 flex flex-col">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">{slotInfo.shortLabel}</p>
          <p className="text-xs font-medium line-clamp-2 mt-0.5">{post.title}</p>
        </div>
      </div>
    </button>
  );
}

