"use client";

import * as React from "react";
import { ExternalLink, Edit, Eye, Heart, MessageCircle, Bookmark } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CONTENT_TYPES, FORMATS, STATUSES, type Post } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";

export function PostPopover({
  post,
  position,
  onClose,
  onEdit,
}: {
  post: Post;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
}) {
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handleClickOutside), 0);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const typeInfo = post.content_type ? CONTENT_TYPES[post.content_type] : null;
  const perf = post.performance ?? {};

  // Smart positioning to stay in viewport
  const [adjustedPos, setAdjustedPos] = React.useState(position);
  React.useEffect(() => {
    if (!popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    let x = position.x;
    let y = position.y;
    if (x + rect.width > winW - 16) x = winW - rect.width - 16;
    if (x < 16) x = 16;
    if (y + rect.height > winH - 16) y = position.y - rect.height - 8;
    if (y < 16) y = 16;
    setAdjustedPos({ x, y });
  }, [position]);

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-80 rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      {post.visual_url && (
        <a
          href={post.source_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "relative block aspect-[4/5] w-full bg-muted group/img",
            !post.source_url && "pointer-events-none"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.visual_url}
            alt=""
            className="absolute inset-0 size-full object-cover"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
          {post.source_url && (
            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/95 text-black px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                <ExternalLink className="size-3.5" /> Ouvrir
              </div>
            </div>
          )}
          {typeInfo && (
            <Badge className={cn("absolute top-2 left-2", `bg-${typeInfo.color} text-white`)}>
              {typeInfo.emoji} {typeInfo.label}
            </Badge>
          )}
          <Badge variant={post.status.toLowerCase() as never} className="absolute top-2 right-2 text-[10px]">
            {STATUSES[post.status].label}
          </Badge>
        </a>
      )}

      <div className="p-3 space-y-2">
        <div>
          <p className="font-semibold text-sm line-clamp-2">{post.title}</p>
          {post.scheduled_for && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {FORMATS[post.format].emoji} {FORMATS[post.format].label} · {formatRelative(post.scheduled_for)}
            </p>
          )}
        </div>

        {post.caption && (
          <p className="text-xs text-muted-foreground line-clamp-3">{post.caption}</p>
        )}

        {post.status === "PUBLISHED" && (perf.views || perf.likes || perf.comments || perf.saves) && (
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground py-1 border-y border-border">
            {perf.views !== undefined && (
              <span className="flex items-center gap-1"><Eye className="size-3" /> {formatNum(perf.views)}</span>
            )}
            {perf.likes !== undefined && (
              <span className="flex items-center gap-1"><Heart className="size-3" /> {formatNum(perf.likes)}</span>
            )}
            {perf.comments !== undefined && (
              <span className="flex items-center gap-1"><MessageCircle className="size-3" /> {formatNum(perf.comments)}</span>
            )}
            {perf.saves !== undefined && (
              <span className="flex items-center gap-1"><Bookmark className="size-3" /> {formatNum(perf.saves)}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 pt-1">
          {post.source_url && (
            <>
              <CopyButton value={post.source_url} label="Copier" className="border border-border" size="xs" />
              <Button variant="outline" size="sm" asChild className="h-7 px-2 text-xs">
                <a href={post.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3" /> Ouvrir
                </a>
              </Button>
            </>
          )}
          <Button variant="default" size="sm" onClick={() => { onClose(); onEdit(); }} className="ml-auto h-7 px-3 text-xs">
            <Edit className="size-3" /> Éditer
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 1 : 0) + "k";
  return (n / 1_000_000).toFixed(1) + "M";
}
