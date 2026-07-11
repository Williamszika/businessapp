-- =====================================================================
-- ZKA — Déclencheur d'envoi des notifications push (remplace le "Webhook")
-- À exécuter dans Supabase → SQL Editor APRÈS avoir déployé l'Edge Function
-- "notify" (avec "Verify JWT" DÉSACTIVÉ) et défini les secrets VAPID.
-- Idempotent.
-- =====================================================================

create extension if not exists pg_net with schema extensions;

-- À chaque nouveau message, appelle l'Edge Function "notify" avec le message inséré.
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url     := 'https://cwfwzwiuhjuyiaaqmhmu.supabase.co/functions/v1/super-handler',
    headers := jsonb_build_object('Content-Type','application/json'),
    body    := jsonb_build_object('type','INSERT','table','messages','record', to_jsonb(new))
  );
  return new;
end; $$;

drop trigger if exists on_new_message on public.messages;
create trigger on_new_message after insert on public.messages
  for each row execute function public.notify_new_message();
