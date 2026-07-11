-- =====================================================================
-- ZKA — Commissions perso (commercial 5 %, responsable 5 %), réglables par le président.
--   Le responsable touche EN PLUS 2 % sur les ventes de son équipe (override, réglé à la paie).
-- À exécuter dans Supabase → SQL Editor (après create-account.sql). Idempotent.
-- =====================================================================

-- 1) Taux par défaut sur les comptes existants
update public.profiles set comm = 0.05 where role = 'commercial'   and coalesce(comm, 0) = 0;
update public.profiles set comm = 0.05 where role = 'responsable'  and coalesce(comm, 0) = 0;

-- 2) Filet de sécurité : à la création d'un profil, appliquer le taux par défaut du poste
create or replace function public.set_default_comm()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.comm is null or new.comm = 0 then
    new.comm := case new.role when 'commercial' then 0.05 when 'responsable' then 0.05 else 0 end;
  end if;
  return new;
end; $$;
drop trigger if exists profiles_default_comm on public.profiles;
create trigger profiles_default_comm before insert on public.profiles
  for each row execute function public.set_default_comm();

-- 3) Président : régler la commission d'un membre (fraction, ex. 0.05 = 5 %)
create or replace function public.admin_set_comm(p_target uuid, p_comm numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_president() then raise exception 'Réservé au président'; end if;
  update public.profiles set comm = greatest(0, coalesce(p_comm, 0)) where id = p_target;
end; $$;
grant execute on function public.admin_set_comm(uuid, numeric) to authenticated;
