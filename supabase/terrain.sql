-- =====================================================================
-- ZKA — Terrain : ventes à crédit / créances + demandes de réapprovisionnement
-- À exécuter dans Supabase → SQL Editor (après schema.sql / hierarchy.sql). Idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Créances clients : suivre les ventes à crédit non encore encaissées
-- ---------------------------------------------------------------------
alter table public.sales add column if not exists paid_at timestamptz;
-- Les ventes déjà passées non-crédit sont considérées encaissées à leur date.
update public.sales set paid_at = created_at where paid_at is null and coalesce(pay,'') <> 'crédit';

-- Enregistrer une vente : une vente à CRÉDIT reste "non payée" (paid_at null) ;
-- toute autre (espèces / mobile / carte) est encaissée immédiatement.
create or replace function public.record_sale(p_items jsonb, p_pay text, p_customer text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid := auth.uid();
  v_role text; v_sale uuid; v_total numeric := 0; it jsonb;
  v_pid uuid; v_qty integer; v_have integer; v_price numeric; v_name text;
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
    select price, name into v_price, v_name from products where id = v_pid;
    insert into sale_items(sale_id, product_id, name, quantity, unit_price)
      values (v_sale, v_pid, v_name, v_qty, v_price);
    update holdings set qty = qty - v_qty where holder_id = v_caller and product_id = v_pid;
    delete from holdings where holder_id = v_caller and product_id = v_pid and qty <= 0;
    v_total := v_total + v_qty * v_price;
  end loop;

  update sales set total = v_total where id = v_sale;
  return v_sale;
end; $$;
grant execute on function public.record_sale(jsonb, text, text) to authenticated;

-- Marquer une vente à crédit comme ENCAISSÉE.
-- Autorisé : le vendeur lui-même, son responsable, ou la direction.
create or replace function public.settle_sale(p_sale uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_caller uuid := auth.uid(); v_seller uuid; v_role text;
begin
  if v_caller is null then raise exception 'Non authentifié'; end if;
  select seller_id into v_seller from public.sales where id = p_sale;
  if v_seller is null then raise exception 'Vente introuvable'; end if;
  select role into v_role from public.profiles where id = v_caller;
  if not (v_caller = v_seller or v_role = 'boss'
          or exists (select 1 from public.profiles p where p.id = v_seller and p.mgr = v_caller)) then
    raise exception 'Non autorisé';
  end if;
  update public.sales set paid_at = now() where id = p_sale and paid_at is null;
end; $$;
grant execute on function public.settle_sale(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 2) Demandes de réapprovisionnement (commercial → responsable → direction)
-- ---------------------------------------------------------------------
create table if not exists public.stock_requests (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  qty          integer not null default 0,
  status       text not null default 'en_attente' check (status in ('en_attente','fait','refusé')),
  note         text,
  requested_at timestamptz not null default now(),
  resolved_at  timestamptz
);
alter table public.stock_requests enable row level security;
grant select, insert, update, delete on public.stock_requests to authenticated;
drop policy if exists "sreq_read" on public.stock_requests;
create policy "sreq_read" on public.stock_requests for select to authenticated using (
  requester_id = auth.uid()
  or public.my_role() = 'boss'
  or exists (select 1 from public.profiles p where p.id = stock_requests.requester_id and p.mgr = auth.uid())
);
drop policy if exists "sreq_insert_self" on public.stock_requests;
create policy "sreq_insert_self" on public.stock_requests for insert to authenticated with check (requester_id = auth.uid());

-- Un membre demande du stock d'un produit
create or replace function public.request_stock(p_product uuid, p_qty integer)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'Quantité invalide'; end if;
  insert into public.stock_requests(requester_id, product_id, qty)
    values (auth.uid(), p_product, p_qty) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.request_stock(uuid, integer) to authenticated;

-- Le responsable (ou la direction) traite une demande : 'fait' ou 'refusé'
create or replace function public.resolve_stock_request(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_caller uuid := auth.uid(); v_req uuid; v_reqmgr uuid; v_role text;
begin
  if v_caller is null then raise exception 'Non authentifié'; end if;
  if p_status not in ('fait','refusé') then raise exception 'Statut invalide'; end if;
  select requester_id into v_req from public.stock_requests where id = p_id;
  if v_req is null then raise exception 'Demande introuvable'; end if;
  select role into v_role from public.profiles where id = v_caller;
  select mgr into v_reqmgr from public.profiles where id = v_req;
  if not (v_role = 'boss' or v_reqmgr = v_caller) then raise exception 'Non autorisé'; end if;
  update public.stock_requests set status = p_status, resolved_at = now() where id = p_id;
end; $$;
grant execute on function public.resolve_stock_request(uuid, text) to authenticated;

do $$ begin alter publication supabase_realtime add table public.stock_requests; exception when duplicate_object then null; end $$;
