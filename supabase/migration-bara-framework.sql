-- Migration : passage du funnel TOFU/MOFU/BOFU au framework Bara (Expertise/Audience/Attachement)
-- + ajout du système Salve / Légion

-- 1) Nouveau type content_type
do $$ begin
  if not exists (select 1 from pg_type where typname = 'content_type_bara') then
    create type content_type_bara as enum ('EXPERT', 'AUDIENCE', 'ATTACHEMENT', 'VALEUR');
  end if;
end $$;

-- 2) Slots fixes de la semaine
do $$ begin
  if not exists (select 1 from pg_type where typname = 'week_slot') then
    create type week_slot as enum ('MON_0631', 'TUE_1104', 'WED_1217', 'FRI_1600', 'SUN_0500');
  end if;
end $$;

-- 3) Ajouter les nouvelles colonnes
alter table posts
  add column if not exists content_type content_type_bara,
  add column if not exists salve_number integer,
  add column if not exists legion_number integer,
  add column if not exists week_slot week_slot,
  add column if not exists inspi_from text;

-- 4) Drop les anciennes colonnes funnel (si tu veux les garder pour migration douce, commente ces lignes)
alter table posts drop column if exists funnel_stage;
alter table posts drop column if exists pillar;

-- 5) Drop l'ancien index funnel
drop index if exists idx_posts_funnel_stage;

create index if not exists idx_posts_content_type on posts(content_type);
create index if not exists idx_posts_legion on posts(legion_number);
create index if not exists idx_posts_salve on posts(legion_number, salve_number);

-- 6) Idem pour templates
alter table templates drop column if exists funnel_stage;
alter table templates drop column if exists pillar;
alter table templates add column if not exists content_type content_type_bara;

-- 7) Vider les anciens templates système (ils étaient basés sur TOFU/MOFU/BOFU)
delete from templates where is_system = true;

-- 8) Insérer les templates Bara système (5 slots × 3 salves = 15 patterns)
insert into templates (name, format, content_type, hook_template, caption_template, cta_template, hashtags, visual_brief, is_system) values
-- Lundi 06:31 — variable par salve
('Lundi Salve 1 — Personal Branding Clivant', 'REEL', 'ATTACHEMENT',
 'NOT A HOT TAKE :',
 'Une opinion qui pique mais que tu défends à fond. Ex: "Être un bon designer ET rester humble est un truc exceptionnel."',
 'Si t''es d''accord, dis-le en commentaire',
 ARRAY['design', 'mindset', 'opinion'],
 'Plan serré, regard caméra, montage phonk simple style "boom boom boom i want you in my room", text overlay punchy', true),

('Lundi Salve 2 — BOOM Audience', 'REEL', 'AUDIENCE',
 'BOOM',
 'Format viral court avec hook visuel fort. Ex: "BOOM Figma" → demo rapide d''un effet/setup.',
 'Sauvegarde si tu veux essayer',
 ARRAY['figma', 'design', 'tutorial'],
 'Hook visuel "BOOM" en 1 frame, démo rapide 5-10s, transition cut sec', true),

('Lundi Salve 3 — BOOM Portfolio', 'REEL', 'AUDIENCE',
 'BOOM le portfolio',
 'Démo express d''un projet de portfolio qui claque. Montre le résultat avant le process.',
 'Lien en bio pour voir tout le projet',
 ARRAY['portfolio', 'design', 'showcase'],
 'Plan rapproché écran ou animation portfolio, effet "wow" en 3s max', true),

-- Mardi 11:04 — EXPERT (toujours)
('Mardi Salve 1 — Tip technique', 'REEL', 'EXPERT',
 'Le truc que j''aurais voulu savoir quand j''ai commencé en [domaine]',
 'Tutoriel actionnable en moins de 30s. Étape 1, 2, 3, bonus. Du concret.',
 'Sauvegarde pour le tester',
 ARRAY['tutorial', 'design', 'astuce'],
 'Screen recording ou démo physique, sous-titres bold, musique trending', true),

('Mardi Salve 2 — Knowledge dévoilé', 'REEL', 'EXPERT',
 '3 trucs simples si tu veux avoir un design clean',
 'Astuce orale en parlant méthode. Ce qui distingue les pros des amateurs.',
 'Quel est ton préféré ?',
 ARRAY['design', 'pro', 'method'],
 'Plan caméra direct, énergie haute, on parle vite, on cite des principes pas des outils', true),

('Mardi Salve 3 — Tryhard B-Roll Expert', 'REEL', 'EXPERT',
 'POV : tu deviens un designer qui fait des trucs comme ça',
 'B-roll travaillé qui montre ton process. Style /tcastro/. Du beau qui prouve la maîtrise.',
 'Lien dans la bio pour bosser avec moi',
 ARRAY['design', 'process', 'craft'],
 'B-roll ultra clean, gimbal, lighting soigné, color grade, cuts au beat musical', true),

-- Mercredi 12:17 — ATTACHEMENT (avis clivant, toujours)
('Mercredi — Avis clivant comparatif', 'REEL', 'ATTACHEMENT',
 'Ça c''est nul. Ça c''est un mois de taff.',
 'Compare deux travaux : un dashboard qui fait joli vs un dashboard qui répond à de vrais user cases. Affirme une opinion forte.',
 'T''es de quel côté ?',
 ARRAY['design', 'opinion', 'dashboard'],
 'Filmé style Samx ou Gin : plan serré, visage parlant, transitions sec, texte overlay opinion', true),

-- Vendredi 16:00 — AUDIENCE B-Roll (Salve 1 + 2) ou VALEUR (Salve 3)
('Vendredi Salve 1 & 2 — B-Roll Audience', 'REEL', 'AUDIENCE',
 'Hook visuel sans parole nécessaire',
 'B-Roll inspiré de Ioannis ou sebastiangohan. Style cinéma, music drop, esthétique pure pour grossir le compte.',
 'Suis pour plus',
 ARRAY['broll', 'cinematic', 'design'],
 'Cinematic shots, slow-mo, lighting moody, transitions au beat, pas ou peu de parole', true),

('Vendredi Salve 3 — VALEUR donnée', 'CAROUSEL', 'VALEUR',
 '3 tips Figma avancés que personne ne partage',
 'Tu donnes du gratuit qui aurait pu être payant. Knowledge profond. Pas un tuto basique, pas un conseil cliché — quelque chose que tu as testé et qui marche.',
 'Si t''as kiffé, lien en bio pour la suite',
 ARRAY['figma', 'advanced', 'free'],
 'Carrousel 7-10 slides, chaque tip = 1-2 slides, screenshots clean, last slide = CTA SKOOL/lien', true),

-- Dimanche 05:00 — ATTACHEMENT story (toujours)
('Dimanche Salve 1 — Story évolution', 'REEL', 'ATTACHEMENT',
 'Il y a [X] ans, j''étais [point A]. Aujourd''hui...',
 'Story personnelle d''évolution. Pas besoin de parler explicitement — tu peux montrer en images. Style "Outfit of ze night" : montrer plus que dire.',
 'Quelle est ton point A ?',
 ARRAY['parcours', 'evolution', 'story'],
 'Mix B-roll passé/présent, voix off optionnelle, musique nostalgique', true),

('Dimanche Salve 2 — Script attachement CTA', 'REEL', 'ATTACHEMENT',
 'Honnêtement j''aime pas les calls...',
 'Tu fais une vidéo "j''aime pas les calls" mais en overlay tu écris "BOOK CALLS = BECOME RICH". Le contraste crée l''attachement et la conversion.',
 'Lien en bio pour booker',
 ARRAY['business', 'realtalk', 'ironie'],
 'Style Jaeyippy : plan caméra direct, ton fatigué/honnête, overlay text qui contraste', true),

('Dimanche Salve 3 — Story + Outfit attachement', 'REEL', 'ATTACHEMENT',
 'Story d''évolution finale + relate',
 'Story qui boucle la légion. Tu rappelles d''où tu viens, où t''es, et tu termines par l''opinion forte que tu défends. Tu fermes la boucle de la légion.',
 'On se voit dans la prochaine légion',
 ARRAY['evolution', 'legion', 'finale'],
 'Mix montage best-of de la légion + outro impactante avec nouvelle prise de position', true);

-- 9) Reset le pattern de la semaine pour les futurs posts à venir
-- (Optionnel : si tu veux pré-générer les slots vides pour les 9 prochaines semaines)

select 'Migration Bara appliquée : ' || count(*)::text || ' templates système chargés.' from templates where is_system = true;
