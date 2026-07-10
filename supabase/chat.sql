-- =====================================================================
-- ZKA — Messagerie : chat public + messages privés (1 à 1)
--   Texte, emojis, photos, documents, messages vocaux (fichiers via Storage).
-- À exécuter dans Supabase → SQL Editor (Run). Idempotent.
-- =====================================================================

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  scope        text not null default 'public' check (scope in ('public','dm')),
  sender_id    uuid references public.profiles(id) on delete set null,
  recipient_id uuid references public.profiles(id) on delete set null,  -- pour un message privé
  body         text,
  kind         text not null default 'text' check (kind in ('text','image','audio','file')),
  url          text,   -- fichier (photo / vocal / document)
  name         text,   -- nom du fichier
  created_at   timestamptz not null default now()
);
alter table public.messages enable row level security;
grant select, insert on public.messages to authenticated;

-- Lecture : le chat public pour tous les connectés ; un privé seulement pour ses 2 membres.
drop policy if exists "messages_read" on public.messages;
create policy "messages_read" on public.messages for select to authenticated using (
  scope = 'public' or sender_id = auth.uid() or recipient_id = auth.uid()
);
-- Écriture : on ne poste qu'en son nom ; un privé doit avoir un destinataire.
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and (scope = 'public' or recipient_id is not null)
);

do $$ begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Stockage des fichiers du chat (photos, vocaux, documents)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('chat','chat', true)
  on conflict (id) do update set public = true;

drop policy if exists "chat_read" on storage.objects;
create policy "chat_read" on storage.objects for select to public using (bucket_id = 'chat');

drop policy if exists "chat_insert" on storage.objects;
create policy "chat_insert" on storage.objects for insert to authenticated with check (bucket_id = 'chat');
