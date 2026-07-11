-- =====================================================================
-- ZKA — Chat : répondre à un message (citation) + supprimer son message
-- À exécuter dans Supabase → SQL Editor (après chat.sql). Idempotent.
-- =====================================================================

-- Répondre : lien vers le message cité
alter table public.messages add column if not exists reply_to uuid references public.messages(id) on delete set null;

-- Supprimer : chacun peut supprimer SES propres messages
grant delete on public.messages to authenticated;
drop policy if exists "messages_delete" on public.messages;
create policy "messages_delete" on public.messages for delete to authenticated using (sender_id = auth.uid());
