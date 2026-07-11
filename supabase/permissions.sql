-- =====================================================================
-- ZKA — Permissions & profils (à exécuter APRÈS schema.sql / finances.sql)
-- ---------------------------------------------------------------------
-- • Le PRÉSIDENT = un compte "boss" avec sup = true.
-- • Seul le président crée / supprime des comptes et modifie les rôles.
-- • Chacun peut modifier SON profil (nom / icône / téléphone) — mais PLUS
--   son rôle (corrige la faille d'auto-promotion).
-- Toutes les écritures sur "profiles" passent par des fonctions contrôlées.
-- =====================================================================

-- Stocker l'email dans le profil (pour l'afficher dans l'app) + reprise de l'existant.
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

-- À la création d'un compte, renseigner aussi l'email dans le profil.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'commercial', new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end; $$;

-- Le compte courant est-il le président ?
create or replace function public.is_president()
returns boolean language sql security definer set search_path = public stable as $$
  select coalesce((select (role = 'boss' and sup) from public.profiles where id = auth.uid()), false);
$$;
grant execute on function public.is_president() to authenticated, anon;

-- On retire l'écriture directe sur profiles (évite l'auto-changement de rôle).
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_boss_all"    on public.profiles;
revoke insert, update, delete on public.profiles from authenticated;
-- (la lecture reste ouverte aux connectés via la politique profiles_read)

-- Modifier SON propre profil : nom / icône / téléphone uniquement.
create or replace function public.update_my_profile(p_name text, p_emoji text, p_phone text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  update public.profiles set
    name  = coalesce(nullif(trim(p_name), ''), name),
    emoji = coalesce(nullif(p_emoji, ''), emoji),
    phone = coalesce(p_phone, phone)
  where id = auth.uid();
end; $$;
grant execute on function public.update_my_profile(text, text, text) to authenticated;

-- Président : changer le rôle d'un membre.
create or replace function public.admin_set_role(p_target uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_president() then raise exception 'Réservé au président'; end if;
  if p_role not in ('boss','responsable','commercial') then raise exception 'Rôle invalide'; end if;
  update public.profiles
     set role = p_role,
         mgr  = case when p_role = 'commercial' then mgr else null end,
         sup  = case when p_role = 'boss' then sup else false end
   where id = p_target;
end; $$;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

-- Président : rattacher un commercial à un responsable.
create or replace function public.admin_set_mgr(p_target uuid, p_mgr uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_president() then raise exception 'Réservé au président'; end if;
  update public.profiles set mgr = p_mgr where id = p_target and role = 'commercial';
end; $$;
grant execute on function public.admin_set_mgr(uuid, uuid) to authenticated;

-- Président : définir la part de participation d'un membre de la direction (%).
create or replace function public.admin_set_share(p_target uuid, p_own numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_president() then raise exception 'Réservé au président'; end if;
  update public.profiles set own = greatest(0, coalesce(p_own, 0)) where id = p_target and role = 'boss';
end; $$;
grant execute on function public.admin_set_share(uuid, numeric) to authenticated;
