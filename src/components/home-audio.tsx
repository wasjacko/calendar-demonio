"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";

const STORAGE_KEY = "home-audio-muted";

/**
 * Audio de fond sur la home — joue le thème All For One.
 * - Tente l'autoplay au premier touch sur la page (les navigateurs
 *   bloquent l'autoplay sans interaction).
 * - Bouton flottant pour mute/unmute, préférence persistée.
 * - Loop pour rester ambiance permanente.
 */
export function HomeAudio() {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = React.useState(false);
  const [started, setStarted] = React.useState(false);

  // Charge la préférence mute au mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setMuted(true);
    } catch {}
  }, []);

  // Autoplay au premier touch n'importe où sur la page
  React.useEffect(() => {
    if (started) return;
    const tryStart = () => {
      const a = audioRef.current;
      if (!a) return;
      a.volume = 0.35; // volume modéré par défaut
      a.play()
        .then(() => setStarted(true))
        .catch(() => {
          // Autoplay bloqué — restera silencieux jusqu'au prochain tap
        });
    };
    // Essai immédiat (au cas où)
    tryStart();
    // Sinon, déclenche au premier interaction
    const events: (keyof DocumentEventMap)[] = ["touchstart", "click", "keydown"];
    const onInteract = () => {
      tryStart();
    };
    events.forEach((e) => document.addEventListener(e, onInteract, { once: true }));
    return () => {
      events.forEach((e) => document.removeEventListener(e, onInteract));
    };
  }, [started]);

  // Applique l'état muted
  React.useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
    try {
      localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
    } catch {}
  }, [muted]);

  return (
    <>
      <audio
        ref={audioRef}
        src="/all-for-one-theme.mp3"
        loop
        preload="auto"
        playsInline
      />
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Activer le son" : "Couper le son"}
        title={muted ? "Activer le son" : "Couper le son"}
        className="fixed top-4 right-4 z-40 size-10 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-card active:scale-95 transition-all md:hidden"
        style={{ top: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        {muted ? (
          <VolumeX className="size-4" />
        ) : (
          <Volume2 className="size-4" />
        )}
      </button>
    </>
  );
}
