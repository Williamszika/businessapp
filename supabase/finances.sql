-- =====================================================================
-- ZKA — Finances : dépenses + réception de stock (à exécuter APRÈS schema.sql)
-- Ajoute le suivi des dépenses et le calcul des bénéfices / revenus par produit.
-- Sans danger à ré-exécuter.
-- =====================================================================

-- Table des dépenses (achats de stock, loyer, salaires, transport, etc.)
create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  amount     numeric not null default 0,
  category   text not null default 'Achat stock',
  product_id uuid references public.products(id) on delete set null,
  qty        integer,
  at         timestamptz not null default now(),
  by_id      uuid references public.profiles(id) on delete set null
);

alter table public.expenses enable row level security;
drop policy if exists "expenses_boss" on public.expenses;
create policy "expenses_boss" on public.expenses for all to authenticated
  using (public.my_role() = 'boss') with check (public.my_role() = 'boss');
grant select, insert, update, delete on public.expenses to authenticated;

-- Réceptionner du stock (achat) : ajoute au stock de l'entrepôt ET enregistre
-- la dépense correspondante (quantité × coût unitaire). Réservé à la direction.
create or replace function public.receive_stock(p_product uuid, p_qty integer, p_unit_cost numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_name text;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'boss' then
    raise exception 'Réservé à la direction';
  end if;
  if p_qty is null or p_qty <= 0 then raise exception 'Quantité invalide'; end if;
  update public.products
     set stock = stock + p_qty,
         cost  = coalesce(p_unit_cost, cost)
   where id = p_product
   returning name into v_name;
  if v_name is null then raise exception 'Produit introuvable'; end if;
  insert into public.expenses(label, amount, category, product_id, qty, by_id)
  values ('Achat — ' || v_name, p_qty * coalesce(p_unit_cost, 0), 'Achat stock', p_product, p_qty, auth.uid());
end;
$$;
grant execute on function public.receive_stock(uuid, integer, numeric) to authenticated;

-- Synchro temps réel des dépenses
do $$ begin
  alter publication supabase_realtime add table public.expenses;
exception when duplicate_object then null; end $$;
