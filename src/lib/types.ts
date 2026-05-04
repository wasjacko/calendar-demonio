export type FunnelStage = "TOFU" | "MOFU" | "BOFU";
export type ContentFormat = "REEL" | "POST" | "CAROUSEL" | "STORY" | "LIVE";
export type ContentStatus = "IDEA" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "MISSED";
export type ContentPillar =
  | "EDUCATION"
  | "INSPIRATION"
  | "TESTIMONIAL"
  | "BTS"
  | "PROMO"
  | "ENGAGEMENT"
  | "STORYTELLING"
  | "AUTHORITY";

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
  funnel_stage: FunnelStage;
  pillar: ContentPillar | null;
  status: ContentStatus;
  scheduled_for: string | null;
  published_at: string | null;
  notes: string | null;
  performance: PostPerformance | null;
  template_id: string | null;
  week_number: number | null;
  created_at: string;
  updated_at: string;
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

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
}

export interface Template {
  id: string;
  user_id: string | null;
  name: string;
  format: ContentFormat;
  funnel_stage: FunnelStage;
  pillar: ContentPillar | null;
  hook_template: string;
  caption_template: string;
  cta_template: string;
  hashtags: string[];
  visual_brief: string | null;
  is_system: boolean;
  created_at: string;
}

export interface FunnelGoal {
  id: string;
  user_id: string;
  week_start: string;
  tofu_target: number;
  mofu_target: number;
  bofu_target: number;
  skool_signups_target: number;
  notes: string | null;
}

export const FUNNEL_STAGES: Record<FunnelStage, { label: string; description: string; color: string; ratio: number }> = {
  TOFU: {
    label: "Awareness",
    description: "Attire l'attention de nouveaux profils — viralité, hooks, valeur immédiate",
    color: "tofu",
    ratio: 0.6,
  },
  MOFU: {
    label: "Engagement",
    description: "Construit la relation — éducation, autorité, témoignages, lifestyle",
    color: "mofu",
    ratio: 0.3,
  },
  BOFU: {
    label: "Conversion SKOOL",
    description: "Convertit vers la communauté SKOOL — CTAs, offre, social proof, urgence",
    color: "bofu",
    ratio: 0.1,
  },
};

export const FORMATS: Record<ContentFormat, { label: string; emoji: string; description: string }> = {
  REEL: { label: "Reel", emoji: "🎬", description: "Vidéo verticale, max 90s, viralité++" },
  POST: { label: "Post", emoji: "🖼️", description: "Image unique, valeur condensée" },
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

export const PILLARS: Record<ContentPillar, { label: string; emoji: string; recommendedStage: FunnelStage }> = {
  EDUCATION: { label: "Éducation", emoji: "🎓", recommendedStage: "MOFU" },
  INSPIRATION: { label: "Inspiration", emoji: "✨", recommendedStage: "TOFU" },
  TESTIMONIAL: { label: "Témoignage", emoji: "💬", recommendedStage: "BOFU" },
  BTS: { label: "Coulisses", emoji: "🎥", recommendedStage: "MOFU" },
  PROMO: { label: "Promo SKOOL", emoji: "🚀", recommendedStage: "BOFU" },
  ENGAGEMENT: { label: "Engagement", emoji: "❤️", recommendedStage: "TOFU" },
  STORYTELLING: { label: "Storytelling", emoji: "📖", recommendedStage: "MOFU" },
  AUTHORITY: { label: "Autorité", emoji: "👑", recommendedStage: "BOFU" },
};
