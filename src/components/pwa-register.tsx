"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // Vérifier les mises à jour à chaque ouverture/focus
        registration.update().catch(() => {});

        registration.addEventListener("updatefound", () => {
          const newSW = registration.installing;
          if (!newSW) return;
          newSW.addEventListener("statechange", () => {
            if (newSW.state === "installed" && navigator.serviceWorker.controller) {
              // Auto-reload pour que la nouvelle UI prenne le relais immédiatement
              window.location.reload();
            }
          });
        });
      } catch (err) {
        console.warn("[SW] registration failed", err);
      }
    };

    register();

    // Quand le SW envoie SW_UPDATED, on reload pour récupérer la nouvelle UI
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "SW_UPDATED") {
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    // Forcer un check de mise à jour quand l'onglet redevient visible
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        navigator.serviceWorker.getRegistration().then((reg) => reg?.update().catch(() => {}));
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      const dismissed = sessionStorage.getItem("pwa-install-dismissed");
      if (!dismissed) setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      navigator.serviceWorker.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      toast.success("App installée 🎉");
    }
    setInstallPrompt(null);
    setShowInstall(false);
  };

  const dismiss = () => {
    sessionStorage.setItem("pwa-install-dismissed", "1");
    setShowInstall(false);
  };

  if (!showInstall || !installPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-4 shadow-2xl glass animate-in slide-in-from-bottom-4 md:left-auto md:right-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-foreground shrink-0">
          <Download className="size-5 text-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Installer Editorial</p>
          <p className="text-xs text-muted-foreground">
            Lance l&apos;app depuis ton écran d&apos;accueil et reçois les notifs même app fermée.
          </p>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground" aria-label="Fermer">
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        >
          Installer
        </button>
        <button onClick={dismiss} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
          Plus tard
        </button>
      </div>
    </div>
  );
}
