"use client";

import * as React from "react";
import { Search, Plus } from "lucide-react";
import { useDataStore, useUIStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CONTENT_TYPES, FORMATS, type ContentType, type Template } from "@/lib/types";
import { createPost } from "@/lib/posts";
import { toast } from "sonner";

export default function TemplatesPage() {
  const templates = useDataStore((s) => s.templates);
  const upsertPost = useDataStore((s) => s.upsertPost);
  const { openEditor } = useUIStore();
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<ContentType | "ALL">("ALL");

  const filtered = React.useMemo(() => {
    return templates.filter((t) => {
      if (typeFilter !== "ALL" && t.content_type !== typeFilter) return false;
      if (search.trim() === "") return true;
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.hook_template.toLowerCase().includes(q) ||
        t.caption_template.toLowerCase().includes(q)
      );
    });
  }, [templates, search, typeFilter]);

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
        content_type: template.content_type,
        status: "DRAFT",
        template_id: template.id,
      });
      upsertPost(created);
      toast.success("Post créé depuis le template");
      openEditor(created.id);
    } catch {
      toast.error("Erreur");
    }
  };

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-7 max-w-5xl mx-auto space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un template…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as ContentType | "ALL")}>
        <TabsList className="w-full grid grid-cols-5 h-9">
          <TabsTrigger value="ALL" className="text-xs">Tous</TabsTrigger>
          {(Object.keys(CONTENT_TYPES) as ContentType[]).map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs">
              <span className={`size-1.5 rounded-full bg-${CONTENT_TYPES[t].color} mr-1`} />
              {CONTENT_TYPES[t].label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={typeFilter} className="mt-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Aucun template.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
    <div className="rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {template.content_type && (
            <Badge variant={template.content_type.toLowerCase() as never} className="text-[10px]">
              {CONTENT_TYPES[template.content_type].label}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">{FORMATS[template.format].label}</Badge>
        </div>
      </div>
      <p className="font-semibold text-sm leading-tight">{template.name}</p>
      <div className="space-y-2 flex-1">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Hook</p>
          <p className="text-xs italic text-muted-foreground line-clamp-2 mt-0.5">&quot;{template.hook_template}&quot;</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={onUse}>
        <Plus className="size-3.5" /> Utiliser
      </Button>
    </div>
  );
}
