-- =====================================================================
-- ZKA — Amorçage (à exécuter APRÈS schema.sql)
-- ---------------------------------------------------------------------
-- 1) Crée automatiquement un "profil" pour chaque nouveau compte.
-- 2) Remplit l'entrepôt central avec des produits de départ.
-- 3) Promeut VOTRE compte en direction (boss).
--
-- AVANT de lancer : créez d'abord votre compte dans
--   Supabase → Authentication → Users → Add user  (email + mot de passe)
-- puis remplacez ci-dessous 'zikabiabraham@protonmail.com' par cet email.
-- =====================================================================

-- 1) À chaque nouveau compte Auth, créer un profil (rôle par défaut : commercial)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'commercial')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Produits de départ dans l'entrepôt central (uniquement si vide)
insert into public.products (name, sku, cat, price, cost, stock, reorder, unit, emoji)
select * from (values
  ('Coca-Cola 33cl',      'BOI-001', 'Boissons',    500,   300,  124, 40, 'pièce',     '🥤'),
  ('Eau minérale 1,5L',   'BOI-002', 'Boissons',    400,   250,   78, 30, 'pièce',     '💧'),
  ('Riz parfumé 5kg',     'EPI-001', 'Épicerie',   6500,  5200,   26, 10, 'sac',       '🍚'),
  ('Huile végétale 1L',   'EPI-002', 'Épicerie',   1800,  1400,    8, 15, 'bouteille', '🛢️'),
  ('Savon de Marseille',  'HYG-001', 'Hygiène',     750,   450,   62, 25, 'pièce',     '🧼'),
  ('Café soluble 200g',   'EPI-003', 'Épicerie',   3500,  2600,   22, 12, 'pot',       '☕'),
  ('Lait en poudre 400g', 'EPI-004', 'Épicerie',   2800,  2100,    5, 10, 'boîte',     '🥛'),
  ('Câble USB-C',         'ACC-001', 'Accessoires',3000,  1200,   41, 15, 'pièce',     '🔌'),
  ('Écouteurs sans fil',  'ACC-002', 'Accessoires',12500, 7500,   14,  8, 'pièce',     '🎧'),
  ('T-shirt coton',       'VET-001', 'Vêtements',  4500,  2500,   37, 12, 'pièce',     '👕'),
  ('Casquette ZKA',       'VET-002', 'Vêtements',  3500,  1500,    6, 10, 'pièce',     '🧢'),
  ('Biscuits chocolat',   'EPI-005', 'Épicerie',    900,   600,   96, 30, 'paquet',    '🍪')
) as v(name, sku, cat, price, cost, stock, reorder, unit, emoji)
where not exists (select 1 from public.products);

-- 3) Promouvoir votre compte en direction (boss).
--    >>> Remplacez 'VOTRE_EMAIL_ICI' par l'email du compte que vous venez de créer. <<<
insert into public.profiles (id, name, role, sup)
select u.id, 'Direction', 'boss', true
from auth.users u
where u.email = 'VOTRE_EMAIL_ICI'
on conflict (id) do update set role = 'boss', sup = true;

-- Fin. Vous pouvez maintenant vous connecter avec cet email dans demo/serveur.html.
