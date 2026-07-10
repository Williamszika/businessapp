-- =====================================================================
-- ZKA — Notifications push : abonnements des appareils
-- À exécuter dans Supabase → SQL Editor (après chat.sql). Idempotent.
-- =====================================================================

create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid references public.profiles(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- Chaque personne gère uniquement les abonnements de ses propres appareils.
drop policy if exists "push_self" on public.push_subscriptions;
create policy "push_self" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- (La fonction serveur d'envoi lit cette table avec la clé "service_role", qui contourne la RLS.)
