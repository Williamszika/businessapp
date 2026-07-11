-- =====================================================================
-- ZKA — Créer / supprimer des comptes DEPUIS l'app, sans Edge Function.
-- ---------------------------------------------------------------------
-- Deux fonctions réservées au PRÉSIDENT, appelées directement par l'app.
-- À exécuter dans Supabase → SQL Editor (après schema.sql + permissions.sql).
-- Sans danger à ré-exécuter.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- Créer un compte (email + mot de passe) + son profil (poste, rattachement).
create or replace function public.admin_create_user(
  p_email text, p_password text, p_name text, p_role text, p_mgr uuid)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid := gen_random_uuid();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_role text;
  v_comm numeric;
begin
  if not public.is_president() then raise exception 'Réservé au président'; end if;
  if v_email = '' or coalesce(p_password, '') = '' then raise exception 'Email et mot de passe requis'; end if;
  if length(p_password) < 6 then raise exception 'Mot de passe : au moins 6 caractères'; end if;
  if exists (select 1 from auth.users where email = v_email) then raise exception 'Cet email existe déjà'; end if;
  v_role := case when p_role in ('boss','responsable','commercial') then p_role else 'commercial' end;
  v_comm := case v_role when 'commercial' then 0.05 when 'responsable' then 0.02 else 0 end;

  insert into auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
     raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
     confirmation_token, recovery_token, email_change_token_new, email_change)
  values
    ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
     crypt(p_password, gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', jsonb_build_object('name', coalesce(p_name, '')),
     now(), now(), '', '', '', '');

  insert into auth.identities
    (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', v_email), 'email', now(), now(), now());

  insert into public.profiles (id, name, role, mgr, email, comm)
  values (v_id, coalesce(nullif(trim(p_name), ''), split_part(v_email, '@', 1)), v_role,
          case when v_role = 'commercial' then p_mgr else null end, v_email, v_comm)
  on conflict (id) do update set name = excluded.name, role = excluded.role, mgr = excluded.mgr, email = excluded.email, comm = excluded.comm;

  return v_id;
end; $$;
grant execute on function public.admin_create_user(text, text, text, text, uuid) to authenticated;

-- Supprimer un compte (le président ne peut pas se supprimer lui-même).
create or replace function public.admin_delete_user(p_target uuid)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_president() then raise exception 'Réservé au président'; end if;
  if p_target = auth.uid() then raise exception 'Le président ne peut pas se supprimer lui-même'; end if;
  delete from auth.users where id = p_target;  -- profil + identité supprimés en cascade
end; $$;
grant execute on function public.admin_delete_user(uuid) to authenticated;
