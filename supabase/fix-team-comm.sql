-- =====================================================================
-- ZKA — CORRECTIF : colonne team_comm (prime d'équipe du responsable)
-- Manquait en base → pay_member_month plantait au paiement d'une commission
-- de responsable, et admin_set_team_comm n'existait pas.
-- À exécuter dans Supabase → SQL Editor (Run). Idempotent, sans danger.
-- =====================================================================

alter table public.profiles add column if not exists team_comm numeric not null default 0.02;

create or replace function public.admin_set_team_comm(p_target uuid, p_rate numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_president() then raise exception 'Réservé au président'; end if;
  update public.profiles set team_comm = greatest(0, coalesce(p_rate, 0))
   where id = p_target and role = 'responsable';
end; $$;
grant execute on function public.admin_set_team_comm(uuid, numeric) to authenticated;
