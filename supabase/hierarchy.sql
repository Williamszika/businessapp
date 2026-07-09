-- =====================================================================
-- ZKA — Hiérarchie stricte & vente par les responsables
--   • Un commercial est OBLIGATOIREMENT rattaché à un responsable.
--   • Les responsables peuvent vendre (5 % sur leurs ventes perso).
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- =====================================================================

-- 1) Commission perso des responsables = 5 % (comme les commerciaux)
update public.profiles set comm = 0.05 where role = 'responsable';

create or replace function public.set_default_comm()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.comm is null or new.comm = 0 then
    new.comm := case new.role when 'commercial' then 0.05 when 'responsable' then 0.05 else 0 end;
  end if;
  return new;
end; $$;
drop trigger if exists profiles_default_comm on public.profiles;
create trigger profiles_default_comm before insert on public.profiles
  for each row execute function public.set_default_comm();

-- 2) Créer un compte : un commercial DOIT avoir un responsable
create or replace function public.admin_create_user(
  p_email text, p_password text, p_name text, p_role text, p_mgr uuid)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid := gen_random_uuid();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_role text;
  v_comm numeric;
begin
  if not public.is_president() then raise exception 'Réservé au président'; end if;
  if v_email = '' or coalesce(p_password, '') = '' then raise exception 'Email et mot de passe requis'; end if;
  if length(p_password) < 6 then raise exception 'Mot de passe : au moins 6 caractères'; end if;
  if exists (select 1 from auth.users where email = v_email) then raise exception 'Cet email existe déjà'; end if;
  v_role := case when p_role in ('boss','responsable','commercial') then p_role else 'commercial' end;
  if v_role = 'commercial' and p_mgr is null then
    raise exception 'Un commercial doit être rattaché à un responsable';
  end if;
  v_comm := case v_role when 'commercial' then 0.05 when 'responsable' then 0.05 else 0 end;

  insert into auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
     raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
     confirmation_token, recovery_token, email_change_token_new, email_change)
  values
    ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
     crypt(p_password, gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', jsonb_build_object('name', coalesce(p_name, '')),
     now(), now(), '', '', '', '');
  insert into auth.identities
    (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', v_email), 'email', now(), now(), now());
  insert into public.profiles (id, name, role, mgr, email, comm)
  values (v_id, coalesce(nullif(trim(p_name), ''), split_part(v_email, '@', 1)), v_role,
          case when v_role = 'commercial' then p_mgr else null end, v_email, v_comm)
  on conflict (id) do update set name = excluded.name, role = excluded.role, mgr = excluded.mgr, email = excluded.email, comm = excluded.comm;
  return v_id;
end; $$;
grant execute on function public.admin_create_user(text, text, text, text, uuid) to authenticated;

-- 3) Vente autorisée aux commerciaux ET aux responsables (depuis leur réserve)
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
  insert into sales(id, ref, seller_id, total, pay, customer)
    values (v_sale, 'ZKA-' || to_char(now(),'YYMMDDHH24MISS'), v_caller, 0, p_pay, p_customer);

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
