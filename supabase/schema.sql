-- =====================================================================
-- ZKA — Schéma de base de données partagée (Supabase / PostgreSQL)
-- ---------------------------------------------------------------------
-- À exécuter UNE FOIS dans Supabase : projet → SQL Editor → coller → Run.
-- Il crée les tables, la sécurité (RLS) et les fonctions serveur qui
-- garantissent que le stock attribué par un responsable/boss se retrouve,
-- de façon cohérente et partagée, chez le bon membre.
--
-- Modèle : chaque compte = une ligne "profiles" liée à un utilisateur
-- Supabase Auth. Le stock central vit dans "products.stock" ; ce que
-- chaque membre détient vit dans "holdings" ; chaque déplacement est
-- journalisé dans "movements".
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Comptes (profils applicatifs, adossés à auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       text not null check (role in ('boss','responsable','commercial')),
  mgr        uuid references public.profiles(id) on delete set null, -- responsable de rattachement (pour un commercial)
  emoji      text,
  status     text not null default 'actif' check (status in ('actif','bloque')),
  comm       numeric not null default 0,   -- taux de commission (commercial)
  own        numeric not null default 0,   -- part de participation (boss), en %
  sup        boolean not null default false, -- super-admin
  phone      text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Produits (entrepôt central)
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  sku       text,
  cat       text not null default 'Divers',
  price     numeric not null default 0,
  cost      numeric not null default 0,
  stock     integer not null default 0,   -- quantité en entrepôt central
  reorder   integer not null default 5,
  unit      text not null default 'pièce',
  emoji     text default '📦'
);

-- ---------------------------------------------------------------------
-- Stock détenu par un membre, produit par produit
-- ---------------------------------------------------------------------
create table if not exists public.holdings (
  holder_id  uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  qty        integer not null default 0 check (qty >= 0),
  primary key (holder_id, product_id)
);

-- ---------------------------------------------------------------------
-- Journal des mouvements de stock (attributions / retraits)
-- ---------------------------------------------------------------------
create table if not exists public.movements (
  id         uuid primary key default gen_random_uuid(),
  at         timestamptz not null default now(),
  by_id      uuid references public.profiles(id) on delete set null,
  holder_id  uuid references public.profiles(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  qty        integer not null   -- >0 = attribué au membre ; <0 = repris
);

-- ---------------------------------------------------------------------
-- Ventes
-- ---------------------------------------------------------------------
create table if not exists public.sales (
  id         uuid primary key default gen_random_uuid(),
  ref        text,
  seller_id  uuid references public.profiles(id) on delete set null,
  total      numeric not null default 0,
  pay        text,
  customer   text,
  created_at timestamptz not null default now()
);
create table if not exists public.sale_items (
  sale_id    uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name       text,
  quantity   integer not null,
  unit_price numeric not null
);

-- =====================================================================
-- Fonctions serveur (logique métier, exécutée côté base, sécurisée)
-- =====================================================================

-- Attribuer / reprendre du stock.
--   p_qty > 0 : la source (entrepôt si boss, réserve du responsable sinon)
--               donne p_qty unités au destinataire.
--   p_qty < 0 : le destinataire rend |p_qty| unités à la source.
-- Contrôles : le boss peut approvisionner tout le monde ; le responsable
-- uniquement ses commerciaux, depuis sa propre réserve.
create or replace function public.assign_stock(p_holder uuid, p_product uuid, p_qty integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_role   text;
  v_holder record;
  v_avail  integer;
  v_move   integer;
begin
  if v_caller is null then raise exception 'Non authentifié'; end if;
  select role into v_role from profiles where id = v_caller;
  select * into v_holder from profiles where id = p_holder;
  if v_holder is null then raise exception 'Destinataire introuvable'; end if;

  -- Droits d'attribution
  if v_role = 'boss' then
    if v_holder.role not in ('responsable','commercial') then raise exception 'Destinataire non autorisé'; end if;
  elsif v_role = 'responsable' then
    if not (v_holder.role = 'commercial' and v_holder.mgr = v_caller) then
      raise exception 'Un responsable ne peut approvisionner que ses commerciaux';
    end if;
  else
    raise exception 'Rôle non autorisé à attribuer du stock';
  end if;

  if p_qty > 0 then
    -- Disponibilité de la source
    if v_role = 'boss' then
      select stock into v_avail from products where id = p_product for update;
    else
      select coalesce(qty,0) into v_avail from holdings where holder_id = v_caller and product_id = p_product for update;
    end if;
    v_move := least(p_qty, coalesce(v_avail,0));
    if v_move <= 0 then return 0; end if;
    -- Retirer de la source
    if v_role = 'boss' then
      update products set stock = stock - v_move where id = p_product;
    else
      update holdings set qty = qty - v_move where holder_id = v_caller and product_id = p_product;
      delete from holdings where holder_id = v_caller and product_id = p_product and qty <= 0;
    end if;
    -- Ajouter au destinataire
    insert into holdings(holder_id, product_id, qty) values (p_holder, p_product, v_move)
      on conflict (holder_id, product_id) do update set qty = holdings.qty + excluded.qty;
  else
    -- Reprise : le destinataire rend à la source
    select coalesce(qty,0) into v_avail from holdings where holder_id = p_holder and product_id = p_product for update;
    v_move := least(-p_qty, coalesce(v_avail,0));
    if v_move <= 0 then return 0; end if;
    update holdings set qty = qty - v_move where holder_id = p_holder and product_id = p_product;
    delete from holdings where holder_id = p_holder and product_id = p_product and qty <= 0;
    if v_role = 'boss' then
      update products set stock = stock + v_move where id = p_product;
    else
      insert into holdings(holder_id, product_id, qty) values (v_caller, p_product, v_move)
        on conflict (holder_id, product_id) do update set qty = holdings.qty + excluded.qty;
    end if;
    v_move := -v_move;
  end if;

  insert into movements(by_id, holder_id, product_id, qty) values (v_caller, p_holder, p_product, v_move);
  return v_move;
end;
$$;

-- Enregistrer une vente : décrémente le stock RÉELLEMENT détenu par le
-- commercial connecté (on ne vend que ce qu'on possède).
-- p_items : JSON [{ "product_id": "...", "quantity": n }, ...]
create or replace function public.record_sale(p_items jsonb, p_pay text, p_customer text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_role   text;
  v_sale   uuid;
  v_total  numeric := 0;
  it       jsonb;
  v_pid    uuid;
  v_qty    integer;
  v_have   integer;
  v_price  numeric;
  v_name   text;
begin
  if v_caller is null then raise exception 'Non authentifié'; end if;
  select role into v_role from profiles where id = v_caller;
  if v_role <> 'commercial' then raise exception 'Seuls les commerciaux vendent'; end if;

  -- Vérifier la disponibilité détenue
  for it in select * from jsonb_array_elements(p_items) loop
    v_pid := (it->>'product_id')::uuid;
    v_qty := (it->>'quantity')::integer;
    select coalesce(qty,0) into v_have from holdings where holder_id = v_caller and product_id = v_pid;
    if coalesce(v_have,0) < v_qty then raise exception 'Stock insuffisant pour un produit'; end if;
  end loop;

  v_sale := gen_random_uuid();
  insert into sales(id, ref, seller_id, total, pay, customer)
    values (v_sale, 'ZKA-' || to_char(now(),'YYMMDDHH24MISS'), v_caller, 0, p_pay, p_customer);

  for it in select * from jsonb_array_elements(p_items) loop
    v_pid := (it->>'product_id')::uuid;
    v_qty := (it->>'quantity')::integer;
    select price, name into v_price, v_name from products where id = v_pid;
    insert into sale_items(sale_id, product_id, name, quantity, unit_price)
      values (v_sale, v_pid, v_name, v_qty, v_price);
    update holdings set qty = qty - v_qty where holder_id = v_caller and product_id = v_pid;
    delete from holdings where holder_id = v_caller and product_id = v_pid and qty <= 0;
    v_total := v_total + v_qty * v_price;
  end loop;

  update sales set total = v_total where id = v_sale;
  return v_sale;
end;
$$;

-- =====================================================================
-- Sécurité (Row Level Security)
-- Lecture partagée entre membres connectés ; écritures sensibles passées
-- par les fonctions ci-dessus. Les produits ne sont modifiables que par
-- un boss.
-- =====================================================================
alter table public.profiles   enable row level security;
alter table public.products   enable row level security;
alter table public.holdings   enable row level security;
alter table public.movements  enable row level security;
alter table public.sales      enable row level security;
alter table public.sale_items enable row level security;

-- Profils : chacun (connecté) voit l'organisation ; met à jour son profil ; le boss met à jour tout le monde
create policy "profiles_read"        on public.profiles for select to authenticated using (true);
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_boss_all"    on public.profiles for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'boss'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'boss'));

-- Produits : lecture pour tous les connectés ; modification réservée au boss
create policy "products_read"     on public.products for select to authenticated using (true);
create policy "products_boss_cud" on public.products for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'boss'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'boss'));

-- Stock détenu / mouvements / ventes : lecture partagée (les écritures passent par les fonctions SECURITY DEFINER)
create policy "holdings_read"   on public.holdings   for select to authenticated using (true);
create policy "movements_read"  on public.movements  for select to authenticated using (true);
create policy "sales_read"      on public.sales      for select to authenticated using (true);
create policy "sale_items_read" on public.sale_items for select to authenticated using (true);

-- =====================================================================
-- Synchronisation temps réel (les téléphones se mettent à jour tout seuls)
-- =====================================================================
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.holdings;
alter publication supabase_realtime add table public.movements;
alter publication supabase_realtime add table public.sales;

-- Fin.
