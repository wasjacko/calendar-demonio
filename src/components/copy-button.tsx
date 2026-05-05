"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label,
  className,
  size = "sm",
  onCopy,
}: {
  value: string;
  label?: string;
  className?: string;
  size?: "xs" | "sm" | "md";
  onCopy?: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success("URL copiée", { description: value.slice(0, 60) });
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const iconSize = size === "xs" ? "size-3" : size === "sm" ? "size-3.5" : "size-4";
  const padding = size === "xs" ? "p-1" : size === "sm" ? "p-1.5" : "p-2";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 rounded transition-colors",
        padding,
        copied ? "text-status-published" : "text-muted-foreground hover:text-foreground hover:bg-accent",
        className
      )}
      title={copied ? "Copié !" : `Copier ${label ?? "l'URL"}`}
    >
      {copied ? <Check className={iconSize} /> : <Copy className={iconSize} />}
      {label && <span className="text-xs">{label}</span>}
    </button>
  );
}
