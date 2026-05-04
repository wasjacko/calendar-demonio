"use client";

import * as React from "react";
import { TrendingUp, AlertTriangle, Lightbulb, Trophy } from "lucide-react";
import { useDataStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { startOfWeek, addWeeks, addDays } from "@/lib/utils";
import { FUNNEL_STAGES, type Post } from "@/lib/types";

const TOTAL_WEEKS = 8;
const TARGET_PER_WEEK = 7;

export function FunnelCoach() {
  const { posts } = useDataStore();
  const insights = React.useMemo(() => generateInsights(posts), [posts]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="size-4 text-primary" /> Coach funnel
        </CardTitle>
        <CardDescription>Recommandations stratégiques pour ton acquisition SKOOL</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Trophy className="size-8 mx-auto mb-2 text-status-published" />
            Tout est parfaitement équilibré. Continue comme ça !
          </div>
        ) : (
          insights.map((insight, i) => (
            <div
              key={i}
              className="flex gap-3 p-3 rounded-lg bg-muted/30 border-l-2 border-primary"
            >
              <div className="shrink-0">
                {insight.type === "warning" && <AlertTriangle className="size-5 text-status-draft" />}
                {insight.type === "tip" && <Lightbulb className="size-5 text-primary" />}
                {insight.type === "success" && <Trophy className="size-5 text-status-published" />}
                {insight.type === "trend" && <TrendingUp className="size-5 text-tofu" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{insight.body}</p>
                {insight.action && (
                  <Badge variant="outline" className="mt-2 text-[10px]">{insight.action}</Badge>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface Insight {
  type: "warning" | "tip" | "success" | "trend";
  title: string;
  body: string;
  action?: string;
}

function generateInsights(posts: Post[]): Insight[] {
  const insights: Insight[] = [];
  const start = startOfWeek(new Date());
  const horizon = addWeeks(start, TOTAL_WEEKS);
  const eightWeekPosts = posts.filter((p) => {
    if (!p.scheduled_for) return false;
    const d = new Date(p.scheduled_for);
    return d >= start && d < horizon;
  });

  const total = eightWeekPosts.length;
  const targetTotal = TOTAL_WEEKS * TARGET_PER_WEEK;
  const tofuCount = eightWeekPosts.filter((p) => p.funnel_stage === "TOFU").length;
  const mofuCount = eightWeekPosts.filter((p) => p.funnel_stage === "MOFU").length;
  const bofuCount = eightWeekPosts.filter((p) => p.funnel_stage === "BOFU").length;

  // Ratio funnel
  if (total > 0) {
    const tofuRatio = tofuCount / total;
    const mofuRatio = mofuCount / total;
    const bofuRatio = bofuCount / total;

    if (tofuRatio < 0.5) {
      insights.push({
        type: "warning",
        title: "Pas assez d'awareness (TOFU)",
        body: `Seulement ${Math.round(tofuRatio * 100)}% de tes posts sont TOFU. Sans nouveaux yeux, ton funnel s'épuise. Vise 60% pour alimenter le haut du funnel.`,
        action: "Crée 3-5 Reels TOFU cette semaine",
      });
    } else if (tofuRatio > 0.75) {
      insights.push({
        type: "tip",
        title: "Très/trop axé awareness",
        body: `${Math.round(tofuRatio * 100)}% de TOFU c'est top pour grossir vite, mais sans MOFU/BOFU tu loupes les conversions. Prévois plus de témoignages et de CTAs SKOOL.`,
        action: "Ajoute 2 BOFU dans les 14 jours",
      });
    }

    if (bofuRatio === 0) {
      insights.push({
        type: "warning",
        title: "Aucun post de conversion SKOOL",
        body: "Sans BOFU, tes followers n'ont pas de chemin clair vers ta communauté. Programme au moins 1 post BOFU par semaine (témoignage, FAQ, invitation directe).",
        action: "Programme un BOFU cette semaine",
      });
    }

    if (bofuRatio >= 0.08 && bofuRatio <= 0.15) {
      insights.push({
        type: "success",
        title: "Ratio funnel équilibré",
        body: `Avec ${Math.round(bofuRatio * 100)}% de BOFU, tu convertis sans saouler. C'est la fenêtre idéale.`,
      });
    }
  }

  // Volume
  if (total < targetTotal * 0.5) {
    insights.push({
      type: "warning",
      title: "Volume insuffisant",
      body: `Tu n'as que ${total} posts planifiés sur les 8 prochaines semaines (objectif ${targetTotal}). L'algo Instagram récompense la régularité — vise au moins 1 post/jour.`,
      action: "Bloque 1h de batching",
    });
  } else if (total >= targetTotal * 0.8) {
    insights.push({
      type: "success",
      title: "Calendrier solide",
      body: `${total} posts planifiés sur 8 semaines — tu as une visibilité claire. Bravo pour l'anticipation.`,
    });
  }

  // Cette semaine
  const thisWeekEnd = addDays(start, 7);
  const thisWeek = eightWeekPosts.filter((p) => {
    const d = new Date(p.scheduled_for!);
    return d >= start && d < thisWeekEnd;
  });
  if (thisWeek.length < 5) {
    insights.push({
      type: "trend",
      title: "Cette semaine est légère",
      body: `Seulement ${thisWeek.length} post${thisWeek.length > 1 ? "s" : ""} prévu${thisWeek.length > 1 ? "s" : ""} cette semaine. Pour maintenir le momentum, ajoute au moins 2-3 posts (Story comprise).`,
      action: "Ajoute 2 Stories aujourd'hui",
    });
  }

  // Status drafts
  const drafts = eightWeekPosts.filter((p) => p.status === "DRAFT");
  if (drafts.length >= 5) {
    insights.push({
      type: "tip",
      title: `${drafts.length} brouillons en attente`,
      body: "Tu as accumulé pas mal de brouillons. Bloque un créneau pour les finaliser et les programmer — un post non programmé est un post qui ne sortira pas.",
      action: "Session focus 90 min",
    });
  }

  return insights;
}
