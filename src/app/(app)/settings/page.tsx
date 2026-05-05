"use client";

import * as React from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { fetchSettings, updateSettings } from "@/lib/posts";
import {
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
} from "@/lib/notifications";

interface Settings {
  notifications_enabled: boolean;
  default_reminder_minutes: number;
  daily_planning_time: string;
  weekly_review_day: number;
  timezone: string;
  skool_url: string | null;
  brand_voice: string | null;
  target_audience: string | null;
  weekly_post_target: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>("default");
  const [pushSubscribed, setPushSubscribed] = React.useState(false);

  React.useEffect(() => {
    fetchSettings().then((s) => {
      if (s) setSettings(s as Settings);
      setLoading(false);
    });
    getNotificationPermission().then(setPermission);
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setPushSubscribed(!!sub);
      });
    }
  }, []);

  const update = (patch: Partial<Settings>) => setSettings((s) => (s ? { ...s, ...patch } : s));

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings(settings as unknown as Record<string, unknown>);
      toast.success("Réglages enregistrés");
    } catch {
      toast.error("Erreur");
    } finally {
      setSaving(false);
    }
  };

  const enablePush = async () => {
    try {
      await subscribeToPush();
      setPushSubscribed(true);
      setPermission("granted");
      toast.success("Notifications activées");
    } catch (err) {
      toast.error("Erreur", { description: err instanceof Error ? err.message : "Réessaie" });
    }
  };

  const disablePush = async () => {
    try {
      await unsubscribeFromPush();
      setPushSubscribed(false);
      toast.success("Notifications désactivées");
    } catch {
      toast.error("Erreur");
    }
  };

  const testPush = async () => {
    try {
      await sendTestNotification();
      toast.success("Notification envoyée");
    } catch (err) {
      toast.error("Erreur", { description: err instanceof Error ? err.message : undefined });
    }
  };

  if (loading || !settings) {
    return <p className="text-center text-sm text-muted-foreground py-12">Chargement…</p>;
  }

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-7 max-w-2xl mx-auto space-y-9">
      {/* Notifications */}
      <section className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Notifications
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-4 bg-card">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Push sur cet appareil</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pushSubscribed ? (
                <Badge variant="published" className="text-[10px]">Activé</Badge>
              ) : (
                <span>Permission : {permission}</span>
              )}
            </p>
          </div>
          {pushSubscribed ? (
            <Button variant="outline" size="sm" onClick={disablePush}>
              <BellOff className="size-4" /> Désactiver
            </Button>
          ) : (
            <Button variant="gradient" size="sm" onClick={enablePush}>
              <Bell className="size-4" /> Activer
            </Button>
          )}
        </div>

        {pushSubscribed && (
          <Button variant="outline" size="sm" onClick={testPush}>
            <Send className="size-4" /> Tester
          </Button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reminder" className="text-xs">Délai rappel (min avant publication)</Label>
            <Input
              id="reminder"
              type="number"
              min={5}
              max={1440}
              value={settings.default_reminder_minutes}
              onChange={(e) => update({ default_reminder_minutes: parseInt(e.target.value) || 60 })}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="planning" className="text-xs">Heure de planning quotidien</Label>
            <Input
              id="planning"
              type="time"
              value={settings.daily_planning_time}
              onChange={(e) => update({ daily_planning_time: e.target.value })}
              className="h-10"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-4 bg-card">
          <div className="flex-1">
            <p className="text-sm font-medium">Activer toutes les notifications</p>
            <p className="text-xs text-muted-foreground">Master switch.</p>
          </div>
          <Switch
            checked={settings.notifications_enabled}
            onCheckedChange={(c) => update({ notifications_enabled: c })}
          />
        </div>
      </section>

      {/* Brand */}
      <section className="space-y-4">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          Brand & Cible
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="skool_url" className="text-xs">URL SKOOL</Label>
          <Input
            id="skool_url"
            type="url"
            placeholder="https://www.skool.com/…"
            value={settings.skool_url ?? ""}
            onChange={(e) => update({ skool_url: e.target.value })}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audience" className="text-xs">Audience cible</Label>
          <Textarea
            id="audience"
            placeholder="Ex: entrepreneurs francophones 25-40 ans"
            rows={2}
            value={settings.target_audience ?? ""}
            onChange={(e) => update({ target_audience: e.target.value })}
            className="text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="voice" className="text-xs">Ton de voix</Label>
          <Textarea
            id="voice"
            placeholder="Ex: direct, sans bullshit, mix humour et expertise."
            rows={3}
            value={settings.brand_voice ?? ""}
            onChange={(e) => update({ brand_voice: e.target.value })}
            className="text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="weekly" className="text-xs">Posts/semaine</Label>
            <Input
              id="weekly"
              type="number"
              min={1}
              max={30}
              value={settings.weekly_post_target}
              onChange={(e) => update({ weekly_post_target: parseInt(e.target.value) || 5 })}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tz" className="text-xs">Fuseau horaire</Label>
            <Input
              id="tz"
              value={settings.timezone}
              onChange={(e) => update({ timezone: e.target.value })}
              className="h-10"
            />
          </div>
        </div>
      </section>

      <div className="sticky bottom-20 md:bottom-4 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3">
        <Button variant="gradient" onClick={handleSave} disabled={saving} className="w-full h-11">
          {saving ? "Sauvegarde…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
