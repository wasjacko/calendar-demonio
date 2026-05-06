"use client";

import { AddVideoForm } from "@/components/add-video-form";
import { PoolOverview } from "@/components/pool-overview";

export default function HomePage() {
  return (
    <>
      {/* Image de fond — mobile uniquement, contenue dans la zone du HAUT.
          Pas de fixed/inset-0 → l'image ne bave plus sous les cartes,
          donc plus aucun "fade" entre image et form. */}
      <div
        className="md:hidden absolute top-0 left-0 right-0 -z-10 bg-cover bg-top bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/home-bg.jpg')",
          height: "calc(38vh + env(safe-area-inset-top))",
        }}
        aria-hidden="true"
      />

      <div className="px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Espace en haut sur mobile : image visible + safe-area */}
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
