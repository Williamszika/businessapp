-- =====================================================================
-- ZKA — Paie MENSUELLE : commissions & salaires calculés et versés par mois,
-- recalculés et historisés chaque mois. Réservé au président.
-- À exécuter dans Supabase → SQL Editor (après payroll.sql). Idempotent.
-- =====================================================================

-- Chaque versement est rattaché à un MOIS (période 'YYYY-MM').
alter table public.payouts add column if not exists period text;
update public.payouts set period = to_char((paid_at at time zone 'UTC'),'YYYY-MM') where period is null;

-- Le président verse, pour un membre, un TYPE (commission/salaire) et un MOIS.
--   • Commission du mois = taux perso × ventes du membre ce mois
--     + (responsable) taux d'équipe × ventes de son équipe ce mois.
--   • Salaire du mois = salaire mensuel fixé.
--   • On ne verse que le RESTE dû (montant du mois − déjà versé ce mois).
--   • Le versement est enregistré comme dépense et historisé avec sa période.
create or replace function public.pay_member_month(p_member uuid, p_kind text, p_period text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_role text; v_comm numeric; v_team numeric; v_name text; v_salary numeric;
  v_earned numeric := 0; v_paid numeric := 0; v_amount numeric := 0;
begin
  if not public.is_president() then raise exception 'Réservé au président'; end if;
  if p_kind not in ('commission','salaire') then raise exception 'Type invalide'; end if;
  if p_period !~ '^[0-9]{4}-[0-9]{2}$' then raise exception 'Période invalide'; end if;

  select role, coalesce(comm,0), coalesce(team_comm,0.02), name, coalesce(salary,0)
    into v_role, v_comm, v_team, v_name, v_salary
    from public.profiles where id = p_member;
  if v_name is null then raise exception 'Membre introuvable'; end if;

  if p_kind = 'commission' then
    select coalesce(v_comm * sum(total), 0) into v_earned
      from public.sales
     where seller_id = p_member
       and to_char((created_at at time zone 'UTC'),'YYYY-MM') = p_period;
    if v_role = 'responsable' then
      v_earned := v_earned + coalesce((
        select v_team * sum(s.total)
          from public.sales s join public.profiles p on p.id = s.seller_id
         where p.mgr = p_member
           and to_char((s.created_at at time zone 'UTC'),'YYYY-MM') = p_period), 0);
    end if;
    v_earned := round(v_earned);
  else
    v_earned := round(v_salary);
  end if;

  select coalesce(sum(amount),0) into v_paid
    from public.payouts where member_id = p_member and kind = p_kind and period = p_period;

  v_amount := v_earned - v_paid;
  if v_amount <= 0 then raise exception 'Déjà réglé pour ce mois'; end if;

  insert into public.payouts(member_id, kind, amount, note, paid_by, period)
    values (p_member, p_kind, v_amount, null, auth.uid(), p_period);

  insert into public.expenses(label, amount, category, by_id)
    values ((case when p_kind = 'commission' then 'Commission — ' else 'Salaire — ' end) || v_name || ' (' || p_period || ')',
            v_amount, (case when p_kind = 'commission' then 'Commission' else 'Salaire' end), auth.uid());

  update public.payout_requests set status = 'payé', resolved_at = now()
    where member_id = p_member and kind = p_kind and status = 'en_attente';
end; $$;
grant execute on function public.pay_member_month(uuid, text, text) to authenticated;
