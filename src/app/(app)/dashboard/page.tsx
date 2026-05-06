"use client";

import * as React from "react";
import { AddVideoForm } from "@/components/add-video-form";
import { PoolOverview } from "@/components/pool-overview";
import { HomeAudio } from "@/components/home-audio";

export default function HomePage() {
  // Sur mobile, body devient transparent → l'image Garou est le fond
  // de toute la page, jamais de bande blanche derrière les cartes.
  React.useEffect(() => {
    document.body.classList.add("home-transparent");
    return () => document.body.classList.remove("home-transparent");
  }, []);

  return (
    <>
      {/* Audio thème All For One — autoplay au premier touch */}
      <HomeAudio />

      {/* Image de fond — mobile uniquement, FIXE et plein viewport.
          L'image reste visible en permanence derrière le contenu,
          même quand on scroll. */}
      <div
        className="md:hidden fixed inset-0 -z-10 bg-cover bg-top bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/home-bg.jpg')" }}
        aria-hidden="true"
      />

      <div className="px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Espace en haut sur mobile : laisse l'image respirer + safe-area */}
        <div
          className="md:hidden"
          style={{ height: "calc(38vh + env(safe-area-inset-top))" }}
          aria-hidden="true"
        />

        {/* Header — desktop uniquement */}
        <div className="hidden md:block py-10">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            All For One
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Toutes tes vidéos
          </h1>
        </div>

        {/* Form principal — action n°1 */}
        <AddVideoForm />

        {/* Aperçu du pool juste en dessous */}
        <div className="mt-4">
          <PoolOverview />
        </div>

        {/* Respiration en bas avant la bottom nav */}
        <div className="md:hidden h-16" aria-hidden="true" />
      </div>
    </>
  );
}
