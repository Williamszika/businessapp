-- =====================================================================
-- ZKA — Commission PAR PRODUIT
--   Chaque produit a son taux de commission (products.comm_pct).
--   À la vente, ce taux est FIGÉ sur la ligne (sale_items.comm_pct).
--   La commission perso d'un vendeur = somme (taux produit × montant ligne).
--   La prime d'équipe du responsable (2 %) reste inchangée.
-- À exécuter dans Supabase → SQL Editor (après paie-mensuelle.sql). Idempotent.
-- =====================================================================

alter table public.products   add column if not exists comm_pct numeric not null default 0.05;
alter table public.sale_items add column if not exists comm_pct numeric;
-- Historique : figer le taux des ventes déjà passées (depuis le produit, sinon 5 %)
update public.sale_items si
   set comm_pct = coalesce((select p.comm_pct from public.products p where p.id = si.product_id), 0.05)
 where si.comm_pct is null;

-- Enregistrer une vente : fige le taux de commission de chaque ligne + gère le crédit.
create or replace function public.record_sale(p_items jsonb, p_pay text, p_customer text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid := auth.uid();
  v_role text; v_sale uuid; v_total numeric := 0; it jsonb;
  v_pid uuid; v_qty integer; v_have integer; v_price numeric; v_name text; v_pct numeric;
begin
  if v_caller is null then raise exception 'Non authentifié'; end if;
  select role into v_role from profiles where id = v_caller;
  if v_role not in ('commercial','responsable') then raise exception 'Seuls les commerciaux et responsables vendent'; end if;

  for it in select * from jsonb_array_elements(p_items) loop
    v_pid := (it->>'product_id')::uuid; v_qty := (it->>'quantity')::integer;
    select coalesce(qty,0) into v_have from holdings where holder_id = v_caller and product_id = v_pid;
    if coalesce(v_have,0) < v_qty then raise exception 'Stock insuffisant pour un produit'; end if;
  end loop;

  v_sale := gen_random_uuid();
  insert into sales(id, ref, seller_id, total, pay, customer, paid_at)
    values (v_sale, 'ZKA-' || to_char(now(),'YYMMDDHH24MISS'), v_caller, 0, p_pay, p_customer,
            case when p_pay = 'crédit' then null else now() end);

  for it in select * from jsonb_array_elements(p_items) loop
    v_pid := (it->>'product_id')::uuid; v_qty := (it->>'quantity')::integer;
    select price, name, coalesce(comm_pct,0.05) into v_price, v_name, v_pct from products where id = v_pid;
    insert into sale_items(sale_id, product_id, name, quantity, unit_price, comm_pct)
      values (v_sale, v_pid, v_name, v_qty, v_price, v_pct);
    update holdings set qty = qty - v_qty where holder_id = v_caller and product_id = v_pid;
    delete from holdings where holder_id = v_caller and product_id = v_pid and qty <= 0;
    v_total := v_total + v_qty * v_price;
  end loop;

  update sales set total = v_total where id = v_sale;
  return v_sale;
end; $$;
grant execute on function public.record_sale(jsonb, text, text) to authenticated;

-- Paie mensuelle : commission perso par produit + prime d'équipe (2 %) inchangée.
create or replace function public.pay_member_month(p_member uuid, p_kind text, p_period text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_role text; v_team numeric; v_name text; v_salary numeric;
  v_earned numeric := 0; v_paid numeric := 0; v_amount numeric := 0;
begin
  if not public.is_president() then raise exception 'Réservé au président'; end if;
  if p_kind not in ('commission','salaire') then raise exception 'Type invalide'; end if;
  if p_period !~ '^[0-9]{4}-[0-9]{2}$' then raise exception 'Période invalide'; end if;

  select role, coalesce(team_comm,0.02), name, coalesce(salary,0)
    into v_role, v_team, v_name, v_salary
    from public.profiles where id = p_member;
  if v_name is null then raise exception 'Membre introuvable'; end if;

  if p_kind = 'commission' then
    -- Commission perso : taux figé de chaque ligne vendue ce mois
    select coalesce(sum(si.comm_pct * si.quantity * si.unit_price), 0) into v_earned
      from public.sales s join public.sale_items si on si.sale_id = s.id
     where s.seller_id = p_member
       and to_char((s.created_at at time zone 'UTC'),'YYYY-MM') = p_period;
    -- Prime d'équipe (2 %) sur les ventes de l'équipe — inchangée
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
