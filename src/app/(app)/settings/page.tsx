"use client";

import * as React from "react";
import { Settings as SettingsIcon, Bell, BellOff, Send, Globe, Sparkles, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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

  const update = (patch: Partial<Settings>) => {
    setSettings((s) => (s ? { ...s, ...patch } : s));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings(settings as unknown as Record<string, unknown>);
      toast.success("Réglages enregistrés");
    } catch (err) {
      toast.error("Erreur");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const enablePush = async () => {
    try {
      await subscribeToPush();
      setPushSubscribed(true);
      setPermission("granted");
      toast.success("Notifications activées 🔔");
    } catch (err) {
      toast.error("Erreur", { description: err instanceof Error ? err.message : "Réessaie" });
    }
  };

  const disablePush = async () => {
    try {
      await unsubscribeFromPush();
      setPushSubscribed(false);
      toast.success("Notifications désactivées");
    } catch (err) {
      toast.error("Erreur");
      console.error(err);
    }
  };

  const testPush = async () => {
    try {
      await sendTestNotification();
      toast.success("Notification envoyée — vérifie tes notifs");
    } catch (err) {
      toast.error("Erreur", { description: err instanceof Error ? err.message : undefined });
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card><CardContent className="p-12 text-center text-muted-foreground">Chargement…</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="size-6" /> Réglages
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Personnalise tes notifications, ta voix de marque et ton funnel.
        </p>
      </div>

      <Card id="notifications">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" /> Notifications push
          </CardTitle>
          <CardDescription>
            Reçois des rappels avant chaque post programmé, même app fermée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium text-sm">Statut des notifications</p>
              <p className="text-xs text-muted-foreground">
                Permission : <Badge variant="outline" className="capitalize">{permission}</Badge>
                {pushSubscribed && <Badge variant="published" className="ml-2">Cet appareil est abonné</Badge>}
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
              <Send className="size-4" /> Envoyer une notif test
            </Button>
          )}

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reminder">Délai de rappel (minutes avant publication)</Label>
              <Input
                id="reminder"
                type="number"
                min={5}
                max={1440}
                value={settings.default_reminder_minutes}
                onChange={(e) => update({ default_reminder_minutes: parseInt(e.target.value) || 60 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planning_time">Heure de planning quotidien</Label>
              <Input
                id="planning_time"
                type="time"
                value={settings.daily_planning_time}
                onChange={(e) => update({ daily_planning_time: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium text-sm">Activer toutes les notifications</p>
              <p className="text-xs text-muted-foreground">Master switch — désactive tout d&apos;un coup.</p>
            </div>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(c) => update({ notifications_enabled: c })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" /> Brand & funnel
          </CardTitle>
          <CardDescription>Personnalise les recommandations de l&apos;app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skool_url">URL de ta communauté SKOOL</Label>
            <Input
              id="skool_url"
              type="url"
              placeholder="https://www.skool.com/ta-communaute"
              value={settings.skool_url ?? ""}
              onChange={(e) => update({ skool_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              <Globe className="size-3 inline mr-1" />
              Affiché dans les CTAs BOFU pour vérification.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Ton audience cible</Label>
            <Textarea
              id="audience"
              placeholder="Ex: entrepreneurs francophones 25-40 ans qui veulent se libérer du salariat"
              rows={2}
              value={settings.target_audience ?? ""}
              onChange={(e) => update({ target_audience: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice">Ton de voix / brand voice</Label>
            <Textarea
              id="voice"
              placeholder="Ex: direct, sans bullshit, mix entre humour et expertise. On tutoie."
              rows={3}
              value={settings.brand_voice ?? ""}
              onChange={(e) => update({ brand_voice: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekly_target">Objectif posts/semaine</Label>
            <Input
              id="weekly_target"
              type="number"
              min={1}
              max={30}
              value={settings.weekly_post_target}
              onChange={(e) => update({ weekly_post_target: parseInt(e.target.value) || 7 })}
            />
            <p className="text-xs text-muted-foreground">
              7 = 1/jour, 14 = 2/jour. L&apos;algo Instagram récompense la régularité &gt; le volume brut.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuseau horaire</Label>
            <Input
              id="timezone"
              value={settings.timezone}
              onChange={(e) => update({ timezone: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="gradient" onClick={handleSave} disabled={saving}>
          {saving ? <Save className="size-4 animate-pulse" /> : <Save className="size-4" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
