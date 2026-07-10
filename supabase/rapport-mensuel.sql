-- =====================================================================
-- ZKA — RAPPORT MENSUEL (chiffre, stock libéré, dépenses depuis le début)
-- Agrège TOUT l'historique côté serveur (sans la limite d'affichage de
-- l'app), mois par mois, depuis le premier stock / la première vente.
-- Réservé à la direction. À exécuter dans Supabase → SQL Editor (Run).
-- Idempotent.
-- =====================================================================

create or replace function public.monthly_summary()
returns table(
  period          text,     -- 'YYYY-MM'
  revenue         numeric,   -- chiffre d'affaires du mois (ventes)
  units_sold      bigint,    -- unités vendues
  stock_released  bigint,    -- unités sorties de l'entrepôt (attributions direction)
  expenses        numeric,   -- dépenses du mois
  sales_count     bigint     -- nombre de ventes
)
language plpgsql security definer set search_path = public stable as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'boss') then
    raise exception 'Réservé à la direction';
  end if;

  return query
  with rev as (
    select to_char((created_at at time zone 'UTC'),'YYYY-MM') as p,
           sum(total)::numeric as revenue, count(*)::bigint as sales_count
      from public.sales group by 1),
  sold as (
    select to_char((s.created_at at time zone 'UTC'),'YYYY-MM') as p,
           sum(si.quantity)::bigint as units_sold
      from public.sales s join public.sale_items si on si.sale_id = s.id group by 1),
  rel as (
    select to_char((m.at at time zone 'UTC'),'YYYY-MM') as p,
           sum(m.qty)::bigint as stock_released
      from public.movements m join public.profiles pr on pr.id = m.by_id
     where m.qty > 0 and pr.role = 'boss' group by 1),
  exp as (
    select to_char((at at time zone 'UTC'),'YYYY-MM') as p,
           sum(amount)::numeric as expenses
      from public.expenses group by 1),
  allp as (
    select p from rev union select p from sold union select p from rel union select p from exp)
  select a.p,
         coalesce(r.revenue,0)::numeric,
         coalesce(so.units_sold,0)::bigint,
         coalesce(rl.stock_released,0)::bigint,
         coalesce(e.expenses,0)::numeric,
         coalesce(r.sales_count,0)::bigint
    from allp a
    left join rev  r  on r.p  = a.p
    left join sold so on so.p = a.p
    left join rel  rl on rl.p = a.p
    left join exp  e  on e.p  = a.p
   where a.p is not null
   order by a.p desc;
end; $$;

grant execute on function public.monthly_summary() to authenticated;
