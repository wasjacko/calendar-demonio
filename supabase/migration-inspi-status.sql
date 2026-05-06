-- Migration: ajoute un champ "inspi_status" sur posts pour le suivi de
-- création de la vidéo inspirée (vue Légion).
-- États possibles: 'TODO' (à faire), 'DOING' (en cours), 'DONE' (fait).
-- null = aucun état (carte neutre).

alter table posts
  add column if not exists inspi_status text
    check (inspi_status is null or inspi_status in ('TODO', 'DOING', 'DONE'));

create index if not exists idx_posts_inspi_status on posts(inspi_status);
