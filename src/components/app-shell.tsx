"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  TrendingUp,
  Settings,
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
  { href: "/dashboard", label: "All For One", short: "Home", icon: Home },
  { href: "/calendar", label: "Salve", short: "Salve", icon: Calendar },
  { href: "/strategy", label: "Légion", short: "Légion", icon: TrendingUp },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const currentItem = navItems.find((i) => pathname.startsWith(i.href));
  const pageTitle = currentItem?.label ?? (pathname.startsWith("/settings") ? "Réglages" : "Editorial");

  return (
    <div className="flex min-h-svh">
      {/* Sidebar — Desktop only */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card shrink-0">
        <div className="flex h-16 items-center gap-3 px-5 border-b border-border">
          <div className="size-8 rounded-md bg-foreground flex items-center justify-center shrink-0">
            <Home className="size-4 text-background" />
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
                    ? "bg-accent text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — masqué sur mobile /dashboard pour voir l'image de fond */}
        <header
          className={cn(
            "sticky top-0 z-30 h-14 sm:h-16 items-center gap-2 border-b border-border bg-background/85 backdrop-blur px-4 sm:px-6",
            pathname === "/dashboard" ? "hidden md:flex" : "flex"
          )}
        >
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
            className="size-9 rounded-md flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="Réglages"
          >
            <Settings className="size-4" />
          </Link>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom nav — 3 items, plus de + central */}
        <div
          className="md:hidden fixed left-0 right-0 bottom-0 z-30 bg-background/95 backdrop-blur border-t border-border"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <nav className="grid grid-cols-3 items-center h-16 max-w-md mx-auto">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 h-full transition-colors",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  <span className={cn("text-[11px]", active && "font-semibold")}>{item.short}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
