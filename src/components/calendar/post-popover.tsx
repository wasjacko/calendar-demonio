"use client";

import * as React from "react";
import { ExternalLink, Edit, Eye, Heart, MessageCircle, Bookmark, X } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CONTENT_TYPES, FORMATS, STATUSES, type Post } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";
import { useIsMobile } from "@/lib/use-mobile";

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
  const isMobile = useIsMobile();

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 0);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const typeInfo = post.content_type ? CONTENT_TYPES[post.content_type] : null;
  const perf = post.performance ?? {};

  // Smart positioning for desktop only
  const [adjustedPos, setAdjustedPos] = React.useState(position);
  React.useEffect(() => {
    if (isMobile || !popoverRef.current) return;
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
  }, [position, isMobile]);

  const content = (
    <>
      {post.visual_url && (
        <a
          href={post.source_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "relative block w-full bg-muted group/img",
            isMobile ? "aspect-[4/5] max-h-[40svh]" : "aspect-[4/5]",
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

      <div className="p-3 sm:p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-base line-clamp-2">{post.title}</p>
            {post.scheduled_for && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {FORMATS[post.format].emoji} {FORMATS[post.format].label} · {formatRelative(post.scheduled_for)}
              </p>
            )}
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="shrink-0 size-8 rounded-md flex items-center justify-center hover:bg-accent"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {post.caption && (
          <p className="text-xs text-muted-foreground line-clamp-3">{post.caption}</p>
        )}

        {post.status === "PUBLISHED" && (perf.views || perf.likes || perf.comments || perf.saves) && (
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground py-2 border-y border-border">
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

        <div className={cn(
          "flex items-center gap-2 pt-1",
          isMobile && "grid grid-cols-3 gap-2"
        )}>
          {post.source_url ? (
            <>
              <CopyButton
                value={post.source_url}
                label="Copier"
                className={cn(
                  "border border-border justify-center",
                  isMobile ? "w-full h-10" : "h-9 px-3"
                )}
                size={isMobile ? "md" : "sm"}
              />
              <Button
                variant="outline"
                size={isMobile ? "default" : "sm"}
                asChild
                className={cn(isMobile ? "w-full h-10" : "h-9 px-3 text-xs")}
              >
                <a href={post.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" /> Ouvrir
                </a>
              </Button>
            </>
          ) : (
            !isMobile && <div className="flex-1" />
          )}
          <Button
            variant="default"
            size={isMobile ? "default" : "sm"}
            onClick={() => { onClose(); onEdit(); }}
            className={cn(
              isMobile ? "w-full h-10" : "h-9 px-3 ml-auto text-xs"
            )}
          >
            <Edit className="size-3.5" /> Éditer
          </Button>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
        <div
          ref={popoverRef}
          className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom max-h-[92svh] overflow-y-auto"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="sticky top-0 z-10 flex justify-center pt-2 pb-1 bg-card">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          {content}
        </div>
      </>
    );
  }

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-80 rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      {content}
    </div>
  );
}

function formatNum(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 1 : 0) + "k";
  return (n / 1_000_000).toFixed(1) + "M";
}
