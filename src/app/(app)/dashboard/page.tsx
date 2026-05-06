"use client";

import { AddVideoForm } from "@/components/add-video-form";

export default function HomePage() {
  return (
    <>
      {/* Image de fond — mobile uniquement */}
      <div
        className="md:hidden fixed inset-0 -z-10 bg-cover bg-top bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/home-bg.jpg')" }}
        aria-hidden="true"
      />
      {/* Overlay dégradé pour la lisibilité du contenu */}
      <div
        className="md:hidden fixed inset-0 -z-10 pointer-events-none bg-gradient-to-b from-transparent via-background/40 to-background"
        aria-hidden="true"
      />

      <div className="px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Espace en haut sur mobile : safe-area + image visible */}
        <div
          className="md:hidden"
          style={{ height: "calc(35vh + env(safe-area-inset-top))" }}
          aria-hidden="true"
        />

        {/* Header — desktop uniquement */}
        <div className="hidden md:block py-8">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            All For One
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Toutes tes vidéos</h1>
        </div>

        {/* Form inline */}
        <AddVideoForm />
      </div>
    </>
  );
}
