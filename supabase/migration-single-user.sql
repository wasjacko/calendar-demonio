-- Migration : passe en mode mono-utilisateur (sans auth)
-- Désactive RLS + supprime la FK vers auth.users
-- À exécuter UNE FOIS dans Supabase SQL Editor

-- 1) Drop RLS policies
drop policy if exists "Users see own posts" on posts;
drop policy if exists "Users insert own posts" on posts;
drop policy if exists "Users update own posts" on posts;
drop policy if exists "Users delete own posts" on posts;

drop policy if exists "Users see own reminders" on reminders;
drop policy if exists "Users insert own reminders" on reminders;
drop policy if exists "Users update own reminders" on reminders;
drop policy if exists "Users delete own reminders" on reminders;

drop policy if exists "Users see own push subs" on push_subscriptions;
drop policy if exists "Users insert own push subs" on push_subscriptions;
drop policy if exists "Users delete own push subs" on push_subscriptions;

drop policy if exists "Users see own and system templates" on templates;
drop policy if exists "Users insert own templates" on templates;
drop policy if exists "Users update own templates" on templates;
drop policy if exists "Users delete own templates" on templates;

drop policy if exists "Users see own goals" on funnel_goals;
drop policy if exists "Users insert own goals" on funnel_goals;
drop policy if exists "Users update own goals" on funnel_goals;
drop policy if exists "Users delete own goals" on funnel_goals;

drop policy if exists "Users see own settings" on settings;
drop policy if exists "Users insert own settings" on settings;
drop policy if exists "Users update own settings" on settings;

-- 2) Disable RLS (mode mono-user, accès par obscurité de l'URL Vercel)
alter table posts disable row level security;
alter table reminders disable row level security;
alter table push_subscriptions disable row level security;
alter table templates disable row level security;
alter table funnel_goals disable row level security;
alter table settings disable row level security;

-- 3) Drop FK vers auth.users (puisqu'on n'utilise plus l'auth)
alter table posts drop constraint if exists posts_user_id_fkey;
alter table reminders drop constraint if exists reminders_user_id_fkey;
alter table push_subscriptions drop constraint if exists push_subscriptions_user_id_fkey;
alter table templates drop constraint if exists templates_user_id_fkey;
alter table funnel_goals drop constraint if exists funnel_goals_user_id_fkey;
alter table settings drop constraint if exists settings_user_id_fkey;

-- 4) Drop le trigger auto-création settings sur signup (n'a plus de sens sans auth)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- 5) Pré-créer les settings du owner
insert into settings (user_id) values ('1b710e68-be05-46ff-8558-42b60202f731')
  on conflict (user_id) do nothing;

-- 6) Permettre l'accès anon role (utilisé par le client front avec la publishable key)
grant all on posts, reminders, push_subscriptions, templates, funnel_goals, settings to anon, authenticated;
grant usage on schema public to anon, authenticated;

select 'Migration mono-user appliquée. RLS désactivé sur 6 tables.';
