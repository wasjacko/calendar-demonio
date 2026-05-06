"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { useCurrentSalve } from "@/lib/use-current-salve";
import {
  CONTENT_TYPES,
  WEEK_SLOTS,
  WEEK_SLOTS_ORDER,
  SALVE_PATTERNS,
  FORMATS,
  STATUSES,
  type Post,
  type WeekSlot,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export default function StrategyPage() {
  const { posts, loading } = useDataStore();
  const { openEditor } = useUIStore();
  const current = useCurrentSalve();
  const [legion, setLegion] = React.useState(current.legion);

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
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Légion {legion}</h2>
          <p className="text-xs text-muted-foreground">3 salves × 5 créneaux</p>
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
              isCurrent={current.salve === salveNum && legion === current.legion}
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
  onEdit,
  isCurrent,
}: {
  legion: number;
  salve: 1 | 2 | 3;
  postsBySlot: Map<string, Post>;
  onEdit: (id: string) => void;
  isCurrent: boolean;
}) {
  const filled = WEEK_SLOTS_ORDER.filter((s) => postsBySlot.has(`${legion}-${salve}-${s}`)).length;

  return (
    <Card className={cn(isCurrent && "ring-2 ring-primary")}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">Salve {salve}</p>
            {isCurrent && <Badge variant="default" className="text-[9px]">EN COURS</Badge>}
          </div>
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
  expectedType,
  post,
  onEdit,
}: {
  slot: WeekSlot;
  expectedType: import("@/lib/types").ContentType;
  post: Post | undefined;
  onEdit: () => void;
}) {
  const slotInfo = WEEK_SLOTS[slot];
  const typeInfo = CONTENT_TYPES[expectedType];

  if (!post) {
    return (
      <div className="rounded-lg border border-dashed border-border p-3 min-h-[110px] flex flex-col bg-muted/20">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">{slotInfo.shortLabel}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`size-2 rounded-full bg-${typeInfo.color}`} />
          <span className="text-xs text-muted-foreground">{typeInfo.label}</span>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-auto pt-2">Vide</p>
      </div>
    );
  }

  const typeForPost = post.content_type ? CONTENT_TYPES[post.content_type] : typeInfo;

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary transition-all min-h-[110px] flex flex-col group",
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
            <div className={cn("absolute top-1 left-1 size-2.5 rounded-full ring-2 ring-white/80", `bg-${typeForPost.color}`)} />
            <Badge variant={post.status.toLowerCase() as never} className="absolute top-1 right-1 text-[9px]">
              {STATUSES[post.status].label}
            </Badge>
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
      {post.source_url && (
        <div className="absolute bottom-1 right-1 flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
        </div>
      )}
    </div>
  );
}
