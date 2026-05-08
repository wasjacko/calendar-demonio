-- Migration : refonte stratégie Cycle 3 Salves (Attraction → Qualification → Conversion)
--
-- Changements :
-- · ContentType: EXPERT/AUDIENCE/ATTACHEMENT/VALEUR/AUDIENCE_VALEUR (alters)
--   →  DAY_IN_LIFE/COMMENT_REPLY/TUTO/PROCESS/B_ROLL/SPICY_OPINION/CTA_SKOOL (formats concrets)
-- · WeekSlot: MON_0631/TUE_1104/WED_1217/FRI_1600/SUN_0500
--   →  MON_0600/TUE_0600/WED_1100/FRI_1500/SAT_0600
-- · Conversion enums Postgres → text (plus flexible pour évolutions futures)

-- 1) Convertir les colonnes enum → text
alter table posts alter column content_type type text using content_type::text;
alter table posts alter column week_slot type text using week_slot::text;
alter table templates alter column content_type type text using content_type::text;

-- 2) Drop les anciens types enum (CASCADE pour les dépendances)
drop type if exists content_type_bara cascade;
drop type if exists week_slot cascade;

-- 3) Reset les anciennes assignations (slots et types incompatibles avec le nouveau cycle)
update posts
set content_type = null
where content_type in ('EXPERT', 'AUDIENCE', 'ATTACHEMENT', 'VALEUR', 'AUDIENCE_VALEUR');

update posts
set
  legion_number = null,
  salve_number = null,
  week_slot = null,
  inspi_status = null,
  status = case when status = 'SCHEDULED' then 'IDEA' else status end
where week_slot in ('MON_0631', 'TUE_1104', 'WED_1217', 'FRI_1600', 'SUN_0500');

-- 4) Reset les templates système (les anciens étaient liés à l'ancien framework Bara)
delete from templates where is_system = true;
update templates
set content_type = null
where content_type in ('EXPERT', 'AUDIENCE', 'ATTACHEMENT', 'VALEUR', 'AUDIENCE_VALEUR');

-- 5) Recréer l'index sur content_type (si nécessaire)
create index if not exists idx_posts_content_type on posts(content_type);
create index if not exists idx_posts_week_slot on posts(week_slot);

select 'Migration Cycle 3 Salves appliquée. Anciennes assignations remises au pool.' as result;
