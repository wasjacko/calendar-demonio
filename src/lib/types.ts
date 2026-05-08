// Stratégie cycle 3 Salves — Attraction → Qualification → Conversion
// 5 reels / semaine · 15 reels / cycle · jours: Lun · Mar · Mer · Ven · Sam
export type ContentType =
  | "DAY_IN_LIFE"
  | "COMMENT_REPLY"
  | "TUTO"
  | "PROCESS"
  | "B_ROLL"
  | "SPICY_OPINION"
  | "CTA_SKOOL";

export type ContentFormat = "REEL" | "POST" | "CAROUSEL" | "STORY" | "LIVE";
export type ContentStatus = "IDEA" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "MISSED";
export type WeekSlot = "MON_0600" | "TUE_0600" | "WED_1100" | "FRI_1500" | "SAT_0600";
export type InspiStatus = "TODO" | "DOING" | "DONE";

// Salve = mission funnel (les 3 phases du cycle 3 semaines)
export type SalveStage = "ATTRACTION" | "QUALIFICATION" | "CONVERSION";

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
  inspi_status: InspiStatus | null;
  created_at: string;
  updated_at: string;
}

export const INSPI_STATUSES: Record<InspiStatus, { label: string; short: string }> = {
  TODO: { label: "À faire", short: "À faire" },
  DOING: { label: "En cours", short: "En cours" },
  DONE: { label: "Fait", short: "Fait" },
};

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

// Types de poste — nommés "alters" dans l'UI (synonyme: format de poste)
// Le label est la version concrète du contenu, l'astuce vient en complément.
export const CONTENT_TYPES: Record<ContentType, {
  label: string;
  short: string;
  color: string;
  tip: string;
}> = {
  DAY_IN_LIFE: {
    label: "Day in the Life",
    short: "Day in the Life",
    color: "day-in-life",
    tip: "Pote / élément bizarre en arrière-plan = rétention par WTF visuel.",
  },
  COMMENT_REPLY: {
    label: "Réponse commentaire",
    short: "Rép. commentaire",
    color: "comment-reply",
    tip: "Attitude comme Keo + regarde 10 Reels de Keo avant de tourner.",
  },
  TUTO: {
    label: "Tuto",
    short: "Tuto",
    color: "tuto",
    tip: "Sélection design vraiment waw + clair · max 40 sec.",
  },
  PROCESS: {
    label: "Process / Mon taff",
    short: "Process",
    color: "process",
    tip: "« Commente [mot] » → ManyChat envoie le fichier en DM (boost commentaires + capture leads).",
  },
  B_ROLL: {
    label: "B-roll only",
    short: "B-roll",
    color: "b-roll",
    tip: "Phrase impactante mais simple à lire · digestible en 2 sec.",
  },
  SPICY_OPINION: {
    label: "Avis clivant",
    short: "Avis clivant",
    color: "spicy-opinion",
    tip: "Être clivant + bons arguments suffit à percer.",
  },
  CTA_SKOOL: {
    label: "CTA Skool",
    short: "CTA Skool",
    color: "cta-skool",
    tip: "On te voit, mais le client parle en premier (social proof avant pitch).",
  },
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

// Créneaux de la semaine (5 Reels — Lun · Mar · Mer · Ven · Sam)
export const WEEK_SLOTS: Record<WeekSlot, {
  label: string;
  shortLabel: string;
  dayIdx: number; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 5=Fri, 6=Sat
  hour: number;
  minute: number;
  rationale: string;
}> = {
  MON_0600: {
    label: "Lundi 06:00",
    shortLabel: "Lun 06h",
    dayIdx: 1, hour: 6, minute: 0,
    rationale: "Commute matinal · scroll au lit / café · faible compétition · ouverture algo",
  },
  TUE_0600: {
    label: "Mardi 06:00",
    shortLabel: "Mar 06h",
    dayIdx: 2, hour: 6, minute: 0,
    rationale: "Commute matinal · scroll au lit / café · faible compétition · ouverture algo",
  },
  WED_1100: {
    label: "Mercredi 11:00",
    shortLabel: "Mer 11h",
    dayIdx: 3, hour: 11, minute: 0,
    rationale: "Avant pause déjeuner · pic de scroll productif",
  },
  FRI_1500: {
    label: "Vendredi 15:00",
    shortLabel: "Ven 15h",
    dayIdx: 5, hour: 15, minute: 0,
    rationale: "Creux fin de journée bureau · mode détente · débats fin de semaine",
  },
  SAT_0600: {
    label: "Samedi 06:00",
    shortLabel: "Sam 06h",
    dayIdx: 6, hour: 6, minute: 0,
    rationale: "Weekend matin · scroll long · mode bookmark · conversion produit",
  },
};

export const WEEK_SLOTS_ORDER: WeekSlot[] = [
  "MON_0600",
  "TUE_0600",
  "WED_1100",
  "FRI_1500",
  "SAT_0600",
];

// Métadonnées des Salves (mission par phase du funnel)
export const SALVE_STAGES: Record<1 | 2 | 3, {
  stage: SalveStage;
  name: string;
  mission: string;
  pitchRule: string;
}> = {
  1: {
    stage: "ATTRACTION",
    name: "Attraction",
    mission: "Maximum de portée, séduction, 0 pitch.",
    pitchRule: "0 pitch",
  },
  2: {
    stage: "QUALIFICATION",
    name: "Qualification",
    mission: "Positionnement fort, premier bridge produit.",
    pitchRule: "1 pitch déguisé",
  },
  3: {
    stage: "CONVERSION",
    name: "Conversion",
    mission: "Bridge PUCK, closing du cycle.",
    pitchRule: "1 pitch déguisé",
  },
};

// Pattern par Salve : type de post recommandé pour chaque créneau
// + note optionnelle (variante du format pour cette Salve précise)
export interface SalveSlot {
  type: ContentType;
  note?: string;
}

export const SALVE_PATTERNS: Record<1 | 2 | 3, Record<WeekSlot, SalveSlot>> = {
  // SALVE 1 — ATTRACTION (0 pitch)
  1: {
    MON_0600: { type: "DAY_IN_LIFE" },
    TUE_0600: { type: "COMMENT_REPLY" },
    WED_1100: { type: "TUTO" },
    FRI_1500: { type: "B_ROLL" },
    SAT_0600: { type: "PROCESS" },
  },
  // SALVE 2 — QUALIFICATION (1 pitch déguisé)
  2: {
    MON_0600: { type: "DAY_IN_LIFE" },
    TUE_0600: { type: "COMMENT_REPLY" },
    WED_1100: { type: "PROCESS" },
    FRI_1500: { type: "SPICY_OPINION" },
    SAT_0600: { type: "CTA_SKOOL", note: "appel client live" },
  },
  // SALVE 3 — CONVERSION (1 pitch déguisé)
  3: {
    MON_0600: { type: "DAY_IN_LIFE" },
    TUE_0600: { type: "COMMENT_REPLY" },
    WED_1100: { type: "TUTO" },
    FRI_1500: { type: "PROCESS" },
    SAT_0600: { type: "CTA_SKOOL", note: "session coaching" },
  },
};

// Origine du cycle (Lundi 4 mai 2026 = Légion 1, Salve 1, Lundi)
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
