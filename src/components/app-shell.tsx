"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  Settings,
  Plus,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/dashboard", label: "All For One", short: "AFO", icon: LayoutDashboard },
  { href: "/calendar", label: "Semaine", short: "Sem.", icon: Calendar },
  { href: "/strategy", label: "Stratégie", short: "Plan", icon: TrendingUp },
  { href: "/templates", label: "Templates", short: "Tpl.", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const currentItem = navItems.find((i) => pathname.startsWith(i.href));
  const pageTitle = currentItem?.label ?? (pathname.startsWith("/settings") ? "Réglages" : "Editorial");

  const focusAddForm = () => {
    if (pathname !== "/dashboard") router.push("/dashboard");
    setTimeout(() => {
      const el = document.getElementById("add-video");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        const input = el.querySelector("input[type=url]") as HTMLInputElement | null;
        input?.focus();
      }
    }, 200);
  };

  return (
    <div className="flex min-h-svh">
      {/* Sidebar — Desktop only */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card shrink-0">
        <div className="flex h-16 items-center gap-3 px-5 border-b border-border">
          <div className="size-8 rounded-md gradient-brand flex items-center justify-center shrink-0">
            <Calendar className="size-4 text-white" />
          </div>
          <p className="text-sm font-semibold tracking-tight">Editorial</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
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
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/settings")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Settings className="size-4 shrink-0" />
            <span>Réglages</span>
          </Link>
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={focusAddForm}
            className="w-full h-10 rounded-md gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
          >
            <Plus className="size-4" /> Nouveau
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — Minimal */}
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-2 border-b border-border bg-background/85 backdrop-blur px-4 sm:px-6">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate flex-1">{pageTitle}</h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="size-9 rounded-md flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="Thème"
              >
                {theme === "dark" ? <Moon className="size-4" /> : theme === "light" ? <Sun className="size-4" /> : <Monitor className="size-4" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}><Sun className="size-4" /> Clair</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}><Moon className="size-4" /> Sombre</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}><Monitor className="size-4" /> Système</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/settings"
            className="md:hidden size-9 rounded-md flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="Réglages"
          >
            <Settings className="size-4" />
          </Link>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-24 md:pb-0">{children}</main>

        {/* Mobile bottom nav with central + */}
        <div
          className="md:hidden fixed left-0 right-0 bottom-0 z-30 bg-background/95 backdrop-blur border-t border-border"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <nav className="grid grid-cols-5 items-center h-16 max-w-md mx-auto">
            <NavTab item={navItems[0]} active={pathname.startsWith(navItems[0].href)} />
            <NavTab item={navItems[1]} active={pathname.startsWith(navItems[1].href)} />
            <div className="flex items-center justify-center">
              <button
                onClick={focusAddForm}
                className="size-12 rounded-full gradient-brand flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform -translate-y-2"
                aria-label="Nouvelle vidéo"
              >
                <Plus className="size-5 text-white" strokeWidth={2.5} />
              </button>
            </div>
            <NavTab item={navItems[2]} active={pathname.startsWith(navItems[2].href)} />
            <NavTab item={navItems[3]} active={pathname.startsWith(navItems[3].href)} />
          </nav>
        </div>
      </div>
    </div>
  );
}

function NavTab({ item, active }: { item: typeof navItems[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 h-full transition-colors",
        active ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
      <span className={cn("text-[10px]", active && "font-semibold")}>{item.short}</span>
    </Link>
  );
}
