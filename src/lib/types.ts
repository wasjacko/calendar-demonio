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

// Pas d'emoji — juste label + couleur. Les composants UI utilisent des icônes Lucide.
export const CONTENT_TYPES: Record<ContentType, {
  label: string;
  color: string;
}> = {
  EXPERT: { label: "Expert", color: "expert" },
  AUDIENCE: { label: "Audience", color: "audience" },
  ATTACHEMENT: { label: "Attachement", color: "attachement" },
  VALEUR: { label: "Valeur", color: "valeur" },
};

export const FORMATS: Record<ContentFormat, { label: string }> = {
  REEL: { label: "Reel" },
  POST: { label: "Post" },
  CAROUSEL: { label: "Carrousel" },
  STORY: { label: "Story" },
  LIVE: { label: "Live" },
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
  dayIdx: number; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 5=Fri
  hour: number;
  minute: number;
}> = {
  MON_0631: { label: "Lundi 06:31", shortLabel: "Lun 06:31", dayIdx: 1, hour: 6, minute: 31 },
  TUE_1104: { label: "Mardi 11:04", shortLabel: "Mar 11:04", dayIdx: 2, hour: 11, minute: 4 },
  WED_1217: { label: "Mercredi 12:17", shortLabel: "Mer 12:17", dayIdx: 3, hour: 12, minute: 17 },
  FRI_1600: { label: "Vendredi 16:00", shortLabel: "Ven 16:00", dayIdx: 5, hour: 16, minute: 0 },
  SUN_0500: { label: "Dimanche 05:00", shortLabel: "Dim 05:00", dayIdx: 0, hour: 5, minute: 0 },
};

export const WEEK_SLOTS_ORDER: WeekSlot[] = ["MON_0631", "TUE_1104", "WED_1217", "FRI_1600", "SUN_0500"];

// Pattern Bara : type recommandé pour chaque slot d'une salve
export const SALVE_PATTERNS: Record<1 | 2 | 3, Record<WeekSlot, ContentType>> = {
  1: {
    MON_0631: "ATTACHEMENT",
    TUE_1104: "EXPERT",
    WED_1217: "ATTACHEMENT",
    FRI_1600: "AUDIENCE",
    SUN_0500: "ATTACHEMENT",
  },
  2: {
    MON_0631: "AUDIENCE",
    TUE_1104: "EXPERT",
    WED_1217: "ATTACHEMENT",
    FRI_1600: "AUDIENCE",
    SUN_0500: "ATTACHEMENT",
  },
  3: {
    MON_0631: "AUDIENCE",
    TUE_1104: "EXPERT",
    WED_1217: "ATTACHEMENT",
    FRI_1600: "VALEUR",
    SUN_0500: "ATTACHEMENT",
  },
};

// Calcule la date d'un slot donné pour une légion/salve donnée.
// Utilise lundi 4 mai 2026 comme origine (Légion 1 Salve 1 = cette semaine-là).
const ORIGIN = new Date("2026-05-04T00:00:00.000Z").getTime();

export function getDateForSlot(legion: number, salve: 1 | 2 | 3, slot: WeekSlot): Date {
  const weekIdx = (legion - 1) * 3 + (salve - 1);
  const slotInfo = WEEK_SLOTS[slot];
  const monday = new Date(ORIGIN + weekIdx * 7 * 24 * 60 * 60 * 1000);
  const targetDay = slotInfo.dayIdx;
  let dayOffset = targetDay - 1;
  if (targetDay === 0) dayOffset = 6;
  const date = new Date(monday.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  date.setHours(slotInfo.hour, slotInfo.minute, 0, 0);
  return date;
}
