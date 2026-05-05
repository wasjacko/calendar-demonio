"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  Settings,
  Plus,
  Bell,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendrier", icon: Calendar },
  { href: "/strategy", label: "Stratégie 8 sem", icon: TrendingUp },
  { href: "/templates", label: "Templates", icon: Sparkles },
  { href: "/settings", label: "Réglages", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, openEditor } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="flex min-h-svh">
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-[width] duration-200",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
          <div className="flex size-9 items-center justify-center rounded-lg gradient-brand shrink-0">
            <Calendar className="size-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Editorial</p>
              <p className="text-xs text-muted-foreground truncate">SKOOL Funnel</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="size-4 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border space-y-1">
          <Button
            variant="gradient"
            className={cn("w-full justify-center", !sidebarOpen && "px-0")}
            onClick={() => openEditor()}
          >
            <Plus className="size-4" />
            {sidebarOpen && <span>Nouveau post</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="size-4" />
            {sidebarOpen && <span>Réduire</span>}
          </Button>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border p-4 animate-in slide-in-from-left">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-lg gradient-brand flex items-center justify-center">
                  <Calendar className="size-5 text-white" />
                </div>
                <p className="font-semibold">Editorial</p>
              </div>
              <button onClick={() => setMobileNavOpen(false)} aria-label="Fermer">
                <X className="size-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="size-4" /> {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 backdrop-blur px-4 md:px-6">
          <button
            className="md:hidden p-2 -ml-2"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg font-semibold capitalize truncate">
              {navItems.find((i) => pathname.startsWith(i.href))?.label ?? "Editorial"}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild title="Notifications">
              <Link href="/settings#notifications">
                <Bell className="size-4" />
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Thème">
                  {theme === "dark" ? <Moon className="size-4" /> : theme === "light" ? <Sun className="size-4" /> : <Monitor className="size-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}><Sun className="size-4" /> Clair</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}><Moon className="size-4" /> Sombre</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}><Monitor className="size-4" /> Système</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="gradient" size="sm" className="hidden md:inline-flex" onClick={() => openEditor()}>
              <Plus className="size-4" /> Nouveau
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>

        {/* Floating Action Button mobile (Nouveau post) */}
        <button
          onClick={() => openEditor()}
          className="md:hidden fixed bottom-20 right-4 z-30 size-14 rounded-full gradient-brand flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Nouveau post"
        >
          <Plus className="size-6 text-white" />
        </button>

        <div className="md:hidden fixed left-0 right-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
          <nav
            className="grid grid-cols-5 gap-1 p-2"
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          >
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md p-2 text-[10px] font-medium min-h-[3rem] transition-colors",
                    active ? "text-primary bg-primary/5" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="truncate">{item.label.split(" ")[0]}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
