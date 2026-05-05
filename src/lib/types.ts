export type ContentType = "EXPERT" | "AUDIENCE" | "ATTACHEMENT" | "VALEUR";
export type ContentFormat = "REEL" | "POST" | "CAROUSEL" | "STORY" | "LIVE";
export type ContentStatus = "IDEA" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "MISSED";
export type WeekSlot = "MON_0631" | "TUE_1104" | "WED_1217" | "FRI_1600" | "SUN_0500";

export interface OgData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
  format: ContentFormat | "OTHER";
  detected_platform: string;
  hashtags: string[];
}

export interface PostPerformance {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  reach?: number;
  profile_visits?: number;
  link_clicks?: number;
  skool_signups?: number;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  hook: string | null;
  caption: string | null;
  hashtags: string[];
  cta: string | null;
  visual_brief: string | null;
  visual_url: string | null;
  audio_reference: string | null;
  format: ContentFormat;
  content_type: ContentType | null;
  status: ContentStatus;
  scheduled_for: string | null;
  published_at: string | null;
  notes: string | null;
  performance: PostPerformance | null;
  template_id: string | null;
  week_number: number | null;
  source_url: string | null;
  og_data: OgData | null;
  salve_number: number | null;
  legion_number: number | null;
  week_slot: WeekSlot | null;
  inspi_from: string | null;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  user_id: string | null;
  name: string;
  format: ContentFormat;
  content_type: ContentType | null;
  hook_template: string;
  caption_template: string;
  cta_template: string;
  hashtags: string[];
  visual_brief: string | null;
  source_url: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  post_id: string | null;
  title: string;
  body: string | null;
  remind_at: string;
  sent: boolean;
  recurrence: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  created_at: string;
}

export const CONTENT_TYPES: Record<ContentType, {
  label: string;
  description: string;
  role: string;
  color: string;
  emoji: string;
}> = {
  EXPERT: {
    label: "Expertise",
    description: "Tu prouves que tu maîtrises ton domaine",
    role: "TRUST — établit ta crédibilité",
    color: "expert",
    emoji: "🧠",
  },
  AUDIENCE: {
    label: "Audience",
    description: "Tu attires de nouveaux yeux via la viralité",
    role: "REACH — fait grossir le compte",
    color: "audience",
    emoji: "📡",
  },
  ATTACHEMENT: {
    label: "Attachement",
    description: "Tu crées du lien émotionnel — story, opinion, fun",
    role: "BOND — convertit followers en fans",
    color: "attachement",
    emoji: "❤️",
  },
  VALEUR: {
    label: "Valeur",
    description: "Tu donnes du gratuit qui aurait pu être payant",
    role: "GIFT — déclenche la réciprocité, prépare l'achat",
    color: "valeur",
    emoji: "🎁",
  },
};

export const FORMATS: Record<ContentFormat, { label: string; emoji: string; description: string }> = {
  REEL: { label: "Reel", emoji: "🎬", description: "Vidéo verticale, viralité++" },
  POST: { label: "Post", emoji: "🖼️", description: "Image unique" },
  CAROUSEL: { label: "Carrousel", emoji: "📚", description: "10 slides max, éducation profonde" },
  STORY: { label: "Story", emoji: "⚡", description: "24h, intimité & engagement" },
  LIVE: { label: "Live", emoji: "🔴", description: "Direct, autorité & communauté" },
};

export const STATUSES: Record<ContentStatus, { label: string; color: string }> = {
  IDEA: { label: "Idée", color: "status-idea" },
  DRAFT: { label: "Brouillon", color: "status-draft" },
  SCHEDULED: { label: "Programmé", color: "status-scheduled" },
  PUBLISHED: { label: "Publié", color: "status-published" },
  MISSED: { label: "Manqué", color: "status-missed" },
};

export const WEEK_SLOTS: Record<WeekSlot, {
  label: string;
  shortLabel: string;
  dayIdx: 0 | 1 | 2 | 4 | 6; // 0=Sun, 1=Mon, 2=Tue, 4=Thu, 6=Sat
  hour: number;
  minute: number;
}> = {
  MON_0631: { label: "Lundi 06:31", shortLabel: "Lun 06:31", dayIdx: 1, hour: 6, minute: 31 },
  TUE_1104: { label: "Mardi 11:04", shortLabel: "Mar 11:04", dayIdx: 2, hour: 11, minute: 4 },
  WED_1217: { label: "Mercredi 12:17", shortLabel: "Mer 12:17", dayIdx: 3 as never, hour: 12, minute: 17 },
  FRI_1600: { label: "Vendredi 16:00", shortLabel: "Ven 16:00", dayIdx: 5 as never, hour: 16, minute: 0 },
  SUN_0500: { label: "Dimanche 05:00", shortLabel: "Dim 05:00", dayIdx: 0, hour: 5, minute: 0 },
};

export const WEEK_SLOTS_ORDER: WeekSlot[] = ["MON_0631", "TUE_1104", "WED_1217", "FRI_1600", "SUN_0500"];

// Pattern Bara : chaque slot d'une salve a un type de contenu attendu
export const SALVE_PATTERNS: Record<1 | 2 | 3, Record<WeekSlot, {
  type: ContentType;
  concept: string;
  inspi: string;
}>> = {
  1: {
    MON_0631: { type: "ATTACHEMENT", concept: "Personal branding clivant", inspi: "Boom phonk style" },
    TUE_1104: { type: "EXPERT", concept: "Tip technique actionnable", inspi: "Tutoriel cool" },
    WED_1217: { type: "ATTACHEMENT", concept: "Avis clivant comparatif", inspi: "Samx, Gin" },
    FRI_1600: { type: "AUDIENCE", concept: "B-Roll cinématique", inspi: "Ioannis, sebastiangohan" },
    SUN_0500: { type: "ATTACHEMENT", concept: "Story évolution", inspi: "Outfit of ze night" },
  },
  2: {
    MON_0631: { type: "AUDIENCE", concept: "BOOM (format viral)", inspi: "Hook visuel rapide" },
    TUE_1104: { type: "EXPERT", concept: "Knowledge dévoilé / méthode", inspi: "sebastiangohan" },
    WED_1217: { type: "ATTACHEMENT", concept: "Avis clivant comparatif", inspi: "Samx, Gin" },
    FRI_1600: { type: "AUDIENCE", concept: "B-Roll cinématique", inspi: "Ioannis, sebastiangohan" },
    SUN_0500: { type: "ATTACHEMENT", concept: "Script attachement CTA (book calls)", inspi: "Jaeyippy" },
  },
  3: {
    MON_0631: { type: "AUDIENCE", concept: "BOOM Portfolio", inspi: "Démo express projet" },
    TUE_1104: { type: "EXPERT", concept: "Tryhard B-Roll Expert", inspi: "/tcastro/" },
    WED_1217: { type: "ATTACHEMENT", concept: "Avis clivant fort", inspi: "Samx, Gin" },
    FRI_1600: { type: "VALEUR", concept: "Knowledge donné gratuit", inspi: "Carrousel tips avancés" },
    SUN_0500: { type: "ATTACHEMENT", concept: "Story + Outfit, boucle légion", inspi: "Outfit of ze night" },
  },
};

// Origine de référence pour le numéro de Légion
// Lundi 5 mai 2026 = début de Légion 1 (peut être ajusté)
export const LEGION_EPOCH = new Date("2026-05-04T00:00:00.000Z").getTime();

export function getLegionAndSalve(date: Date): { legion: number; salve: 1 | 2 | 3; weekIdx: number } {
  const ms = date.getTime() - LEGION_EPOCH;
  const weekIdx = Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
  const legion = Math.floor(weekIdx / 3) + 1;
  const salve = ((weekIdx % 3) + 1) as 1 | 2 | 3;
  return { legion, salve, weekIdx };
}

export function getDateForSlot(legion: number, salve: 1 | 2 | 3, slot: WeekSlot): Date {
  const weekIdx = (legion - 1) * 3 + (salve - 1);
  const slotInfo = WEEK_SLOTS[slot];
  const monday = new Date(LEGION_EPOCH + weekIdx * 7 * 24 * 60 * 60 * 1000);
  // Adjust to slot's day
  const targetDay = slotInfo.dayIdx;
  // monday.getUTCDay() should be 1 (Monday)
  let dayOffset = (targetDay as number) - 1;
  if (targetDay === 0) dayOffset = 6; // Sunday is at end of week
  const date = new Date(monday.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  date.setHours(slotInfo.hour, slotInfo.minute, 0, 0);
  return date;
}
