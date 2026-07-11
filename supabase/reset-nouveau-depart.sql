-- =====================================================================
-- ZKA — NOUVEAU DÉPART
-- Vide TOUS les produits + toutes les données (stock, ventes, dépenses,
-- versements, demandes), et SUPPRIME les comptes commerciaux & responsables.
-- La DIRECTION (comptes 'boss' : président + directeurs associés) est CONSERVÉE.
--
-- ⚠️ IRRÉVERSIBLE. À exécuter dans Supabase → SQL Editor (Run).
-- =====================================================================

-- 1) Vider toutes les données transactionnelles
delete from public.sale_items;
delete from public.sales;
delete from public.movements;
delete from public.expenses;
do $$ begin delete from public.payouts;         exception when undefined_table then null; end $$;
do $$ begin delete from public.payout_requests; exception when undefined_table then null; end $$;
do $$ begin delete from public.stock_requests;  exception when undefined_table then null; end $$;
do $$ begin delete from public.messages;        exception when undefined_table then null; end $$;
delete from public.holdings;
delete from public.products;

-- 2) Supprimer les comptes commerciaux & responsables (la direction est gardée).
--    La suppression dans auth.users supprime le profil en cascade.
delete from auth.users u
 using public.profiles p
 where p.id = u.id and p.role in ('commercial','responsable');

-- 3) Remettre les compteurs de commission de la direction à zéro.
do $$ begin update public.profiles set comm_paid_at = now(); exception when undefined_column then null; end $$;

-- Vérification (doit montrer 0 produit / 0 vente / 0 commercial / 0 responsable,
-- et le nombre de comptes de direction conservés) :
select
  (select count(*) from public.products)                          as produits,
  (select count(*) from public.sales)                             as ventes,
  (select count(*) from public.holdings)                          as stock_detenu,
  (select count(*) from public.profiles where role='commercial')  as commerciaux,
  (select count(*) from public.profiles where role='responsable') as responsables,
  (select count(*) from public.profiles where role='boss')        as direction;
