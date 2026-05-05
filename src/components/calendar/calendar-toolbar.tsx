"use client";

import * as React from "react";
import { Search, Filter, X } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CONTENT_TYPES, STATUSES, type ContentType, type ContentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function CalendarToolbar() {
  const { filters, setFilters, resetFilters } = useUIStore();
  const activeFilterCount = filters.contentType.length + filters.status.length;

  const toggleType = (t: ContentType) => {
    const next = filters.contentType.includes(t)
      ? filters.contentType.filter((x) => x !== t)
      : [...filters.contentType, t];
    setFilters({ contentType: next });
  };
  const toggleStatus = (s: ContentStatus) => {
    const next = filters.status.includes(s)
      ? filters.status.filter((x) => x !== s)
      : [...filters.status, s];
    setFilters({ status: next });
  };

  return (
    <div className="flex gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher…"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="pl-9 h-10"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="default" className="h-10 px-3 shrink-0">
            <Filter className="size-4" />
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 px-1.5">{activeFilterCount}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-3">
          <DropdownMenuLabel className="px-0 pb-2 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Catégorie</DropdownMenuLabel>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(CONTENT_TYPES) as ContentType[]).map((t) => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5",
                  filters.contentType.includes(t)
                    ? `bg-${CONTENT_TYPES[t].color} text-white border-transparent`
                    : "border-border hover:bg-accent"
                )}
              >
                <span className={cn("size-1.5 rounded-full", filters.contentType.includes(t) ? "bg-white/80" : `bg-${CONTENT_TYPES[t].color}`)} />
                {CONTENT_TYPES[t].label}
              </button>
            ))}
          </div>

          <DropdownMenuSeparator className="my-3" />
          <DropdownMenuLabel className="px-0 pb-2 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Statut</DropdownMenuLabel>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STATUSES) as ContentStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  filters.status.includes(s)
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border hover:bg-accent"
                )}
              >
                {STATUSES[s].label}
              </button>
            ))}
          </div>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="w-full mt-3" onClick={resetFilters}>
              <X className="size-3" /> Réinitialiser
            </Button>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
