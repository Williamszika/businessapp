-- =====================================================================
-- ZKA — Réinitialiser les DONNÉES (repartir de zéro pour la vraie exploitation)
-- ---------------------------------------------------------------------
-- Efface les produits, le stock détenu, les ventes, les dépenses et les
-- mouvements de test. NE TOUCHE PAS aux comptes (profiles / Authentication).
--
-- À exécuter dans Supabase → SQL Editor quand vous voulez démarrer avec de
-- vraies données. À lancer par la direction (compte boss).
-- =====================================================================

delete from public.sale_items;
delete from public.sales;
delete from public.movements;
delete from public.expenses;
delete from public.holdings;
delete from public.products;

-- Vérification (doit renvoyer 0 partout) :
select
  (select count(*) from public.products)  as produits,
  (select count(*) from public.holdings)  as stock_detenu,
  (select count(*) from public.sales)     as ventes,
  (select count(*) from public.expenses)  as depenses,
  (select count(*) from public.movements) as mouvements;
