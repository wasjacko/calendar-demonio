"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "All For One", short: "Home", icon: Home },
  { href: "/calendar", label: "Salve", short: "Salve", icon: Calendar },
  { href: "/strategy", label: "Légion", short: "Légion", icon: TrendingUp },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const currentItem = navItems.find((i) => pathname.startsWith(i.href));
  const pageTitle = currentItem?.label ?? "Editorial";

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
        {/* Top bar — masqué sur mobile /dashboard et /calendar (Salve).
            Le titre est redondant avec la bottom nav. */}
        <header
          className={cn(
            "sticky top-0 z-30 items-center gap-2 border-b border-border bg-background/85 backdrop-blur px-4 sm:px-6",
            pathname === "/dashboard" || pathname === "/calendar"
              ? "hidden md:flex"
              : "flex"
          )}
          style={{
            paddingTop: "env(safe-area-inset-top)",
            minHeight: "calc(3.5rem + env(safe-area-inset-top))",
          }}
        >
          <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate flex-1 py-3 sm:py-4">
            {pageTitle}
          </h1>
        </header>

        {/* Main content — gros pb pour respirer au-dessus de la bottom nav */}
        <main
          className="flex-1 overflow-auto md:pb-8"
          style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>

        {/* Mobile bottom nav — flottante, arrondie, avec pill indicator */}
        <div
          className="md:hidden fixed left-3 right-3 z-30"
          style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <nav className="grid grid-cols-3 items-center h-16 bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-lg max-w-md mx-auto">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-center h-full transition-transform active:scale-95"
                >
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl transition-all",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                    <span className={cn("text-[10px]", active && "font-semibold")}>
                      {item.short}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
