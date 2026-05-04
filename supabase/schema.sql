-- Editorial Calendar : schéma Supabase complet
-- À exécuter dans Supabase SQL Editor en une seule passe

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_cron;

-- ============================================
-- ENUMS
-- ============================================
create type funnel_stage as enum ('TOFU', 'MOFU', 'BOFU');
create type content_format as enum ('REEL', 'POST', 'CAROUSEL', 'STORY', 'LIVE');
create type content_status as enum ('IDEA', 'DRAFT', 'SCHEDULED', 'PUBLISHED', 'MISSED');
create type content_pillar as enum ('EDUCATION', 'INSPIRATION', 'TESTIMONIAL', 'BTS', 'PROMO', 'ENGAGEMENT', 'STORYTELLING', 'AUTHORITY');
create type recurrence_type as enum ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- ============================================
-- TABLES
-- ============================================

create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  hook text,
  caption text,
  hashtags text[] default '{}',
  cta text,
  visual_brief text,
  visual_url text,
  audio_reference text,
  format content_format not null default 'POST',
  funnel_stage funnel_stage not null default 'TOFU',
  pillar content_pillar,
  status content_status not null default 'IDEA',
  scheduled_for timestamptz,
  published_at timestamptz,
  notes text,
  performance jsonb,
  template_id uuid,
  week_number integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_posts_user_id on posts(user_id);
create index idx_posts_scheduled_for on posts(scheduled_for);
create index idx_posts_status on posts(status);
create index idx_posts_funnel_stage on posts(funnel_stage);
create index idx_posts_week_number on posts(week_number);

create table if not exists reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  title text not null,
  body text,
  remind_at timestamptz not null,
  sent boolean default false,
  recurrence recurrence_type default 'NONE',
  created_at timestamptz default now()
);

create index idx_reminders_user_id on reminders(user_id);
create index idx_reminders_remind_at on reminders(remind_at);
create index idx_reminders_sent on reminders(sent) where sent = false;

create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now()
);

create index idx_push_subs_user on push_subscriptions(user_id);

create table if not exists templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  format content_format not null,
  funnel_stage funnel_stage not null,
  pillar content_pillar,
  hook_template text not null,
  caption_template text not null,
  cta_template text not null,
  hashtags text[] default '{}',
  visual_brief text,
  is_system boolean default false,
  created_at timestamptz default now()
);

create index idx_templates_user on templates(user_id);
create index idx_templates_system on templates(is_system) where is_system = true;

create table if not exists funnel_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  tofu_target integer default 0,
  mofu_target integer default 0,
  bofu_target integer default 0,
  skool_signups_target integer default 0,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

create table if not exists settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notifications_enabled boolean default true,
  default_reminder_minutes integer default 60,
  daily_planning_time time default '09:00:00',
  weekly_review_day integer default 0,
  timezone text default 'Europe/Paris',
  skool_url text,
  brand_voice text,
  target_audience text,
  weekly_post_target integer default 7,
  funnel_ratio jsonb default '{"TOFU": 0.6, "MOFU": 0.3, "BOFU": 0.1}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TRIGGERS
-- ============================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row execute function set_updated_at();

create trigger settings_updated_at
  before update on settings
  for each row execute function set_updated_at();

create or replace function set_week_number()
returns trigger as $$
begin
  if new.scheduled_for is not null then
    new.week_number = extract(week from new.scheduled_for)::integer;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger posts_week_number
  before insert or update on posts
  for each row execute function set_week_number();

-- Auto-create settings on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table posts enable row level security;
alter table reminders enable row level security;
alter table push_subscriptions enable row level security;
alter table templates enable row level security;
alter table funnel_goals enable row level security;
alter table settings enable row level security;

create policy "Users see own posts" on posts for select using (auth.uid() = user_id);
create policy "Users insert own posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users update own posts" on posts for update using (auth.uid() = user_id);
create policy "Users delete own posts" on posts for delete using (auth.uid() = user_id);

create policy "Users see own reminders" on reminders for select using (auth.uid() = user_id);
create policy "Users insert own reminders" on reminders for insert with check (auth.uid() = user_id);
create policy "Users update own reminders" on reminders for update using (auth.uid() = user_id);
create policy "Users delete own reminders" on reminders for delete using (auth.uid() = user_id);

create policy "Users see own push subs" on push_subscriptions for select using (auth.uid() = user_id);
create policy "Users insert own push subs" on push_subscriptions for insert with check (auth.uid() = user_id);
create policy "Users delete own push subs" on push_subscriptions for delete using (auth.uid() = user_id);

create policy "Users see own and system templates" on templates for select using (auth.uid() = user_id or is_system = true);
create policy "Users insert own templates" on templates for insert with check (auth.uid() = user_id and is_system = false);
create policy "Users update own templates" on templates for update using (auth.uid() = user_id and is_system = false);
create policy "Users delete own templates" on templates for delete using (auth.uid() = user_id and is_system = false);

create policy "Users see own goals" on funnel_goals for select using (auth.uid() = user_id);
create policy "Users insert own goals" on funnel_goals for insert with check (auth.uid() = user_id);
create policy "Users update own goals" on funnel_goals for update using (auth.uid() = user_id);
create policy "Users delete own goals" on funnel_goals for delete using (auth.uid() = user_id);

create policy "Users see own settings" on settings for select using (auth.uid() = user_id);
create policy "Users insert own settings" on settings for insert with check (auth.uid() = user_id);
create policy "Users update own settings" on settings for update using (auth.uid() = user_id);

-- ============================================
-- TEMPLATES SYSTÈME (préchargés)
-- ============================================

insert into templates (name, format, funnel_stage, pillar, hook_template, caption_template, cta_template, hashtags, visual_brief, is_system) values
-- TOFU - Awareness
('Hook viral controversé', 'REEL', 'TOFU', 'INSPIRATION',
 'La vérité sur [sujet] que personne n''ose dire 👇',
 'Tout le monde te répète [croyance commune]. Mais la vraie raison c''est [angle inattendu]. J''ai testé pendant [durée], voici ce que j''ai appris : [3 takeaways]. Ça change tout.',
 'Sauvegarde ce post pour le relire 📌',
 ARRAY['mindset', 'developpement', 'reussite'],
 'Plan serré visage, regard caméra, texte choc en overlay 1ère seconde', true),

('POV transformation', 'REEL', 'TOFU', 'STORYTELLING',
 'POV : tu pensais que [croyance], jusqu''à ce que tu découvres [révélation]',
 'Il y a [période] j''étais [situation A]. Aujourd''hui je suis [situation B]. La seule chose qui a changé : [pivot]. Et c''est accessible à tout le monde.',
 'Si t''es prêt à pivoter, commente "GO"',
 ARRAY['transformation', 'motivation', 'parcours'],
 'B-roll avant/après, transition sur beat musical', true),

('3 erreurs à ne pas faire', 'CAROUSEL', 'TOFU', 'EDUCATION',
 '3 erreurs qui te coûtent [bénéfice] sans que tu le saches',
 'Slide 1 : Hook + promesse. Slide 2-4 : Une erreur par slide avec exemple concret. Slide 5 : Récap. Slide 6 : Solution. Slide 7 : CTA.',
 'Quelle erreur t''a le plus parlé ? Dis-le en commentaire',
 ARRAY['conseils', 'erreurs', 'astuces'],
 'Carrousel 7 slides, fond cohérent, typo bold pour les hooks de chaque slide', true),

-- MOFU - Engagement
('Behind the scenes', 'STORY', 'MOFU', 'BTS',
 'Aujourd''hui dans ma journée 🎬',
 'Story 1 : Setup matinal. Story 2 : Tâche du jour. Story 3 : Question à l''audience (sticker). Story 4 : Recap soir.',
 'Vote sur le prochain post (sticker poll)',
 ARRAY[]::text[],
 'Vidéos courtes spontanées, stickers interactifs (poll, questions, slider)', true),

('Étude de cas client', 'CAROUSEL', 'MOFU', 'TESTIMONIAL',
 'Comment [client] est passé de [situation A] à [situation B] en [durée]',
 'Slide 1 : Le résultat (chiffre choc). Slide 2 : Le contexte de départ. Slide 3 : Le problème. Slide 4-6 : La méthode étape par étape. Slide 7 : Le résultat final. Slide 8 : Comment toi aussi tu peux.',
 'Si tu veux le même résultat, lien dans bio',
 ARRAY['casestudy', 'resultats', 'transformation'],
 'Screenshots résultats, photo client si autorisé, branding cohérent', true),

('Tutoriel actionnable', 'REEL', 'MOFU', 'EDUCATION',
 'Le truc que j''aurais voulu savoir quand j''ai commencé [domaine]',
 'En [X] secondes je te montre comment [résultat]. Étape 1 : [...]. Étape 2 : [...]. Étape 3 : [...]. Bonus : [astuce].',
 'Sauvegarde pour le refaire chez toi',
 ARRAY['tutoriel', 'astuce', 'conseil'],
 'Screen recording ou démo physique, sous-titres bold, musique trending', true),

-- BOFU - Conversion SKOOL
('Témoignage SKOOL', 'POST', 'BOFU', 'TESTIMONIAL',
 '[Prénom] a rejoint la communauté il y a [durée]. Voici ce qu''elle/il en pense :',
 'Avant : [pain point]. Aujourd''hui : [transformation]. Ce qui a fait la différence : la communauté SKOOL où on s''entraide chaque jour. [Témoignage texte du membre].',
 'Rejoins-nous → lien en bio',
 ARRAY['communaute', 'skool', 'transformation'],
 'Capture chat SKOOL ou photo membre + résultat chiffré en overlay', true),

('Invitation directe SKOOL', 'REEL', 'BOFU', 'PROMO',
 'Si tu veux [transformation] mais tu sais pas par où commencer, écoute',
 'Dans ma communauté SKOOL on a [bénéfice 1], [bénéfice 2], [bénéfice 3]. C''est [prix] mais surtout c''est l''endroit où des gens comme toi obtiennent [résultat] grâce à [méthode]. Cette semaine [scarcity/bonus].',
 'Lien dans ma bio pour rejoindre',
 ARRAY['communaute', 'opportunite', 'skool'],
 'Plan caméra direct, énergie haute, call-to-action visuel (flèche vers bio)', true),

('FAQ objections SKOOL', 'CAROUSEL', 'BOFU', 'AUTHORITY',
 'Les 5 questions qu''on me pose avant de rejoindre la communauté',
 'Slide 1 : Hook. Slides 2-6 : Une question + réponse rassurante par slide. Slide 7 : Ce que tu obtiens. Slide 8 : Comment rejoindre.',
 'Lien en bio pour découvrir',
 ARRAY['skool', 'faq', 'communaute'],
 'Design clean, typo lisible, photos lifestyle si possible', true);

-- ============================================
-- VUES UTILES
-- ============================================

create or replace view weekly_funnel_distribution as
select
  user_id,
  date_trunc('week', scheduled_for)::date as week_start,
  count(*) filter (where funnel_stage = 'TOFU') as tofu_count,
  count(*) filter (where funnel_stage = 'MOFU') as mofu_count,
  count(*) filter (where funnel_stage = 'BOFU') as bofu_count,
  count(*) as total
from posts
where scheduled_for is not null
group by user_id, date_trunc('week', scheduled_for);

create or replace view next_8_weeks_overview as
select
  generate_series(
    date_trunc('week', current_date)::date,
    date_trunc('week', current_date + interval '7 weeks')::date,
    interval '1 week'
  )::date as week_start;

-- Done
select 'Schéma installé avec succès. Templates système : ' || count(*)::text from templates where is_system = true;
