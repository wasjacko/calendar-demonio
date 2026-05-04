"use client";

import * as React from "react";
import { Sparkles, Search, Plus, Layers } from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FUNNEL_STAGES, FORMATS, PILLARS, type FunnelStage, type Template } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createPost } from "@/lib/posts";
import { toast } from "sonner";

export default function TemplatesPage() {
  const templates = useDataStore((s) => s.templates);
  const upsertPost = useDataStore((s) => s.upsertPost);
  const { openEditor } = useUIStore();
  const [search, setSearch] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState<FunnelStage | "ALL">("ALL");

  const filtered = React.useMemo(() => {
    return templates.filter((t) => {
      if (stageFilter !== "ALL" && t.funnel_stage !== stageFilter) return false;
      if (search.trim() === "") return true;
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.hook_template.toLowerCase().includes(q) ||
        t.caption_template.toLowerCase().includes(q)
      );
    });
  }, [templates, search, stageFilter]);

  const useTemplate = async (template: Template) => {
    try {
      const created = await createPost({
        title: template.name,
        hook: template.hook_template,
        caption: template.caption_template,
        cta: template.cta_template,
        hashtags: template.hashtags,
        visual_brief: template.visual_brief,
        format: template.format,
        funnel_stage: template.funnel_stage,
        pillar: template.pillar,
        status: "DRAFT",
        template_id: template.id,
      });
      upsertPost(created);
      toast.success("Post créé depuis le template", { description: "Édite-le pour le personnaliser." });
      openEditor(created.id);
    } catch (err) {
      toast.error("Erreur");
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="size-6" /> Templates Instagram
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Démarre un post en 1 clic avec des structures qui convertissent.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={stageFilter} onValueChange={(v) => setStageFilter(v as FunnelStage | "ALL")}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="ALL">Tous</TabsTrigger>
          <TabsTrigger value="TOFU"><span className="size-2 rounded-full bg-tofu mr-1.5" />TOFU</TabsTrigger>
          <TabsTrigger value="MOFU"><span className="size-2 rounded-full bg-mofu mr-1.5" />MOFU</TabsTrigger>
          <TabsTrigger value="BOFU"><span className="size-2 rounded-full bg-bofu mr-1.5" />BOFU</TabsTrigger>
        </TabsList>

        <TabsContent value={stageFilter} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Layers className="size-10 mx-auto mb-3 opacity-50" />
                Aucun template ne correspond.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((t) => (
                <TemplateCard key={t.id} template={t} onUse={() => useTemplate(t)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplateCard({ template, onUse }: { template: Template; onUse: () => void }) {
  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={template.funnel_stage.toLowerCase() as never}>{template.funnel_stage}</Badge>
            <Badge variant="outline">{FORMATS[template.format].emoji} {FORMATS[template.format].label}</Badge>
            {template.pillar && (
              <Badge variant="secondary" className="text-[10px]">{PILLARS[template.pillar].emoji} {PILLARS[template.pillar].label}</Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-base mt-2">{template.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Hook</p>
            <p className="text-xs line-clamp-2 italic">&quot;{template.hook_template}&quot;</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Structure</p>
            <p className="text-xs line-clamp-3 text-muted-foreground">{template.caption_template}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">CTA</p>
            <p className="text-xs">{template.cta_template}</p>
          </div>
        </div>
        <Button variant="gradient" size="sm" className="mt-4 w-full" onClick={onUse}>
          <Plus className="size-3.5" /> Utiliser ce template
        </Button>
      </CardContent>
    </Card>
  );
}
