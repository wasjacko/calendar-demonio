-- Migration : ajoute le support des URLs sources (Instagram, etc.)
-- Permet de coller une URL → preview auto → sauvegarde 1 clic

alter table posts
  add column if not exists source_url text,
  add column if not exists og_data jsonb;

create index if not exists idx_posts_source_url on posts(source_url) where source_url is not null;

-- Aussi pour les templates (au cas où on veut référencer une URL d'inspiration)
alter table templates
  add column if not exists source_url text;

select 'Migration source_url appliquée. Colonnes posts.source_url + posts.og_data ajoutées.';
