-- =====================================================================
-- ZKA — Correctif : récursion infinie des politiques RLS sur "profiles"
-- ---------------------------------------------------------------------
-- À exécuter UNE FOIS dans Supabase → SQL Editor si vous aviez lancé une
-- première version de schema.sql (erreur : "infinite recursion detected in
-- policy for relation profiles"). Sans danger à ré-exécuter.
-- =====================================================================

-- Rôle de l'utilisateur courant, lu SANS déclencher la RLS (security definer)
create or replace function public.my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;
grant execute on function public.my_role() to authenticated, anon;

-- Remplacer les politiques qui interrogeaient "profiles" (source de la récursion)
drop policy if exists "profiles_boss_all" on public.profiles;
create policy "profiles_boss_all" on public.profiles for all to authenticated
  using (public.my_role() = 'boss')
  with check (public.my_role() = 'boss');

drop policy if exists "products_boss_cud" on public.products;
create policy "products_boss_cud" on public.products for all to authenticated
  using (public.my_role() = 'boss')
  with check (public.my_role() = 'boss');
