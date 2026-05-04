"use client";

import { createClient } from "@/lib/supabase/client";
import { urlBase64ToUint8Array } from "@/lib/utils";

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return await Notification.requestPermission();
}

export async function subscribeToPush(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Notifications push non supportées sur ce navigateur");
  }

  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    throw new Error("Permission refusée");
  }

  const registration = await navigator.serviceWorker.ready;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) throw new Error("VAPID public key manquante. Ajoute NEXT_PUBLIC_VAPID_PUBLIC_KEY dans .env.local");

  const existing = await registration.pushManager.getSubscription();
  const applicationServerKey = urlBase64ToUint8Array(vapidKey);
  const sub = existing ?? (await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey.buffer.slice(applicationServerKey.byteOffset, applicationServerKey.byteOffset + applicationServerKey.byteLength) as ArrayBuffer,
  }));

  // Send to backend
  const json = sub.toJSON();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utilisateur non connecté");

  await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
    user_agent: navigator.userAgent,
  }, { onConflict: "endpoint" });

  return true;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (typeof window === "undefined") return;
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return;
  await sub.unsubscribe();
  const supabase = createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
}

export async function sendTestNotification(): Promise<void> {
  const res = await fetch("/api/push/test", { method: "POST" });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}
