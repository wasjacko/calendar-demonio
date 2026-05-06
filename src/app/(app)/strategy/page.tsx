"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Circle,
  CircleDashed,
  CircleCheck,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useDataStore, useUIStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { LegionPicker } from "@/components/strategy/legion-picker";
import { useCurrentSalve } from "@/lib/use-current-salve";
import { updatePost } from "@/lib/posts";
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
  const { posts, loading, upsertPost } = useDataStore();
  const { openEditor } = useUIStore();
  const current = useCurrentSalve();
  const [legion, setLegion] = React.useState(current.legion);
  const [pickerTarget, setPickerTarget] = React.useState<{
    legion: number;
    salve: 1 | 2 | 3;
    slot: WeekSlot;
  } | null>(null);

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

  const setInspiStatus = async (post: Post, next: InspiStatus | null) => {
    try {
      const updated = await updatePost(post.id, { inspi_status: next });
      upsertPost(updated);
    } catch {
      toast.error("Erreur");
    }
  };

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
              onEdit={(id) => openEditor(id)}
              onSetInspiStatus={setInspiStatus}
              onPickEmpty={(slot) => setPickerTarget({ legion, salve: salveNum, slot })}
            />
          ))}
        </div>
      )}

      <LegionPicker
        open={pickerTarget !== null}
        target={pickerTarget}
        onClose={() => setPickerTarget(null)}
      />
    </div>
  );
}

function SalveBlock({
  legion,
  salve,
  postsBySlot,
  onEdit,
  onSetInspiStatus,
  onPickEmpty,
}: {
  legion: number;
  salve: 1 | 2 | 3;
  postsBySlot: Map<string, Post>;
  onEdit: (id: string) => void;
  onSetInspiStatus: (post: Post, next: InspiStatus | null) => void;
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
                onSetInspiStatus={onSetInspiStatus}
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
  TODO: "bg-sky-50 border-sky-300 ring-sky-200/60",
  DOING: "bg-amber-50 border-amber-400 ring-amber-200/70",
  DONE: "bg-emerald-50 border-emerald-300 ring-emerald-200/60",
};

const STATE_CHIP_STYLES: Record<InspiStatus, string> = {
  TODO: "bg-sky-500 text-white",
  DOING: "bg-amber-500 text-white",
  DONE: "bg-emerald-500 text-white",
};

function SlotCell({
  slot,
  expectedType,
  post,
  onEdit,
  onSetInspiStatus,
  onPickEmpty,
}: {
  slot: WeekSlot;
  expectedType: import("@/lib/types").ContentType;
  post: Post | undefined;
  onEdit: () => void;
  onSetInspiStatus: (post: Post, next: InspiStatus | null) => void;
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

  const cycle = (target: InspiStatus) => {
    onSetInspiStatus(post, inspi === target ? null : target);
  };

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden border transition-all min-h-[110px] flex flex-col group",
        cardStyle
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
            <div className={cn("absolute top-1 left-1 size-2.5 rounded-full ring-2 ring-white/80", `bg-${typeForPost.color}`)} />
            {inspi && (
              <span
                className={cn(
                  "absolute top-1 right-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ring-2 ring-white/80",
                  STATE_CHIP_STYLES[inspi]
                )}
              >
                {inspi === "TODO" ? "À faire" : inspi === "DOING" ? "En cours" : "Fait"}
              </span>
            )}
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
      </button>

      {/* Cycler 3 états — toujours visible, plein largeur en bas */}
      <div className="grid grid-cols-3 border-t border-current/10 bg-background/40 backdrop-blur-sm">
        <StateButton
          label="À faire"
          icon={Circle}
          active={inspi === "TODO"}
          activeClass="bg-sky-500 text-white"
          onClick={() => cycle("TODO")}
        />
        <StateButton
          label="En cours"
          icon={CircleDashed}
          active={inspi === "DOING"}
          activeClass="bg-amber-500 text-white"
          onClick={() => cycle("DOING")}
        />
        <StateButton
          label="Fait"
          icon={CircleCheck}
          active={inspi === "DONE"}
          activeClass="bg-emerald-500 text-white"
          onClick={() => cycle("DONE")}
        />
      </div>

      {post.source_url && (
        <div className="absolute top-1 right-1 flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {!inspi && (
            <>
              <CopyButton value={post.source_url} className="bg-background/90 backdrop-blur-sm rounded shadow-sm" size="xs" />
              <a
                href={post.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="bg-background/90 backdrop-blur-sm rounded shadow-sm p-1 text-muted-foreground hover:text-foreground"
                title="Ouvrir"
              >
                <ExternalLink className="size-3" />
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StateButton({
  label,
  icon: Icon,
  active,
  activeClass,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors",
        active
          ? activeClass
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Icon className="size-3" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
