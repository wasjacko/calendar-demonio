"use client";

import * as React from "react";
import { Search, Filter, X, Grid3x3, CalendarDays, CalendarRange, List, Layers } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FUNNEL_STAGES, STATUSES, type FunnelStage, type ContentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const VIEW_BUTTONS = [
  { value: "month", label: "Mois", icon: Grid3x3 },
  { value: "week", label: "Semaine", icon: CalendarRange },
  { value: "day", label: "Jour", icon: CalendarDays },
  { value: "list", label: "Liste", icon: List },
  { value: "multimonth", label: "2 mois", icon: Layers },
] as const;

export function CalendarToolbar() {
  const { viewMode, setViewMode, filters, setFilters, resetFilters } = useUIStore();
  const activeFilterCount = filters.funnel.length + filters.status.length;

  const toggleFunnel = (s: FunnelStage) => {
    const next = filters.funnel.includes(s)
      ? filters.funnel.filter((x) => x !== s)
      : [...filters.funnel, s];
    setFilters({ funnel: next });
  };
  const toggleStatus = (s: ContentStatus) => {
    const next = filters.status.includes(s)
      ? filters.status.filter((x) => x !== s)
      : [...filters.status, s];
    setFilters({ status: next });
  };

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un post, un hook, une caption..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="default">
              <Filter className="size-4" /> Filtres
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-3">
            <DropdownMenuLabel className="px-0 pb-2">Étape funnel</DropdownMenuLabel>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(FUNNEL_STAGES) as FunnelStage[]).map((s) => (
                <button
                  key={s}
                  onClick={() => toggleFunnel(s)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    filters.funnel.includes(s)
                      ? `bg-${FUNNEL_STAGES[s].color} text-white border-transparent`
                      : "border-border hover:bg-accent"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <DropdownMenuSeparator className="my-3" />
            <DropdownMenuLabel className="px-0 pb-2">Statut</DropdownMenuLabel>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUSES) as ContentStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors capitalize",
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

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {VIEW_BUTTONS.map((btn) => {
          const Icon = btn.icon;
          const active = viewMode === btn.value;
          return (
            <button
              key={btn.value}
              onClick={() => setViewMode(btn.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" /> {btn.label}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <Legend color="tofu" label="Awareness" />
          <Legend color="mofu" label="Engagement" />
          <Legend color="bofu" label="Conversion" />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="hidden md:inline-flex items-center gap-1.5">
      <span className={`size-2.5 rounded-full bg-${color}`} />
      {label}
    </span>
  );
}
