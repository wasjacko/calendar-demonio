import webpush from "web-push";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:noreply@editorial-calendar.app";
  if (!publicKey || !privateKey) {
    throw new Error("Configure NEXT_PUBLIC_VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY dans tes variables d'environnement");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface NotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: { action: string; title: string }[];
  data?: Record<string, unknown>;
}

export interface PushSubLike {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushNotification(sub: PushSubLike, payload: NotificationPayload) {
  configure();
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
      { TTL: 86400, urgency: "normal" }
    );
    return { ok: true };
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    return { ok: false, status, error: err };
  }
}

export async function sendPushToMany(subs: PushSubLike[], payload: NotificationPayload) {
  return Promise.all(subs.map((s) => sendPushNotification(s, payload)));
}
