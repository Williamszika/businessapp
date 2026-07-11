-- =====================================================================
-- ZKA — NOTIFICATIONS GLOBALES
-- Notifie les membres pour : stock reçu, nouveau produit, demandes de
-- réappro, résolution des demandes, ventes à crédit, versements,
-- alertes de stock faible (terrain + entrepôt).
-- (Les messages du chat ont déjà leur propre notification.)
--
-- Crée la table `notifications` + le centre 🔔 dans l'app, et déclenche
-- l'envoi push (Edge Function "super-handler") à chaque notification.
--
-- À exécuter dans Supabase → SQL Editor (Run). Idempotent, sans danger.
-- =====================================================================

create extension if not exists pg_net with schema extensions;

-- ---------------------------------------------------------------------
-- 1) Table des notifications (une ligne par destinataire)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade, -- destinataire
  title      text not null,
  body       text,
  kind       text not null default 'info',   -- stock|demande|vente|versement|alerte|info
  route      text,                            -- écran à ouvrir dans l'app
  ref        uuid,                            -- id lié éventuel
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;
grant select, update, delete on public.notifications to authenticated;

-- Chacun ne voit / ne modifie que SES notifications. L'insertion se fait
-- uniquement via les fonctions SECURITY DEFINER ci-dessous.
drop policy if exists "notif_select" on public.notifications;
create policy "notif_select" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "notif_update" on public.notifications;
create policy "notif_update" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notif_delete" on public.notifications;
create policy "notif_delete" on public.notifications for delete using (user_id = auth.uid());

-- Temps réel
do $$ begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2) Aides
-- ---------------------------------------------------------------------
-- Montant lisible : « 5 000 FCFA »
create or replace function public.fmt_fcfa(n numeric)
returns text language sql immutable as $$
  select regexp_replace(round(coalesce(n,0))::bigint::text, '(\d)(?=(\d{3})+$)', '\1 ', 'g') || ' FCFA';
$$;

-- Insère une notification (ignore si destinataire nul)
create or replace function public.notify(p_user uuid, p_title text, p_body text,
  p_kind text default 'info', p_route text default null, p_ref uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null then return; end if;
  insert into public.notifications(user_id, title, body, kind, route, ref)
  values (p_user, p_title, coalesce(p_body,''), coalesce(p_kind,'info'), p_route, p_ref);
end; $$;

-- ---------------------------------------------------------------------
-- 3) Déclencheurs métier
-- ---------------------------------------------------------------------

-- (a) Stock attribué à un membre (mouvement positif)
create or replace function public.notif_movement()
returns trigger language plpgsql security definer set search_path = public as $$
declare pn text;
begin
  if coalesce(new.qty,0) > 0 and new.holder_id is not null and new.holder_id is distinct from new.by_id then
    select name into pn from public.products where id = new.product_id;
    perform public.notify(new.holder_id, '📦 Stock reçu',
      new.qty || ' × ' || coalesce(pn,'produit') || ' vous a été attribué',
      'stock', 'stock', new.product_id);
  end if;
  return new;
end; $$;
drop trigger if exists on_movement_notify on public.movements;
create trigger on_movement_notify after insert on public.movements
  for each row execute function public.notif_movement();

-- (b) Nouveau produit disponible → l'équipe de vente est prévenue
create or replace function public.notif_new_product()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from public.profiles where status = 'actif' and role in ('responsable','commercial') loop
    perform public.notify(r.id, '🆕 Nouveau produit',
      coalesce(new.name,'Un produit') || ' est disponible à la vente',
      'stock', 'stock', new.id);
  end loop;
  return new;
end; $$;
drop trigger if exists on_product_new_notify on public.products;
create trigger on_product_new_notify after insert on public.products
  for each row execute function public.notif_new_product();

-- (c) Réappro entrepôt faible → la direction est prévenue
create or replace function public.notif_low_product()
returns trigger language plpgsql security definer set search_path = public as $$
declare b record;
begin
  if new.stock <= new.reorder and (old.stock is null or old.stock > new.reorder) then
    for b in select id from public.profiles where role = 'boss' and status = 'actif' loop
      perform public.notify(b.id, '⚠️ Réappro entrepôt',
        coalesce(new.name,'Un produit') || ' : plus que ' || new.stock || ' en entrepôt',
        'alerte', 'entrepot', new.id);
    end loop;
  end if;
  return new;
end; $$;
drop trigger if exists on_product_low_notify on public.products;
create trigger on_product_low_notify after update on public.products
  for each row execute function public.notif_low_product();

-- (d) Nouvelle demande de réappro → l'approbateur est prévenu
create or replace function public.notif_stock_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare reqrole text; reqmgr uuid; reqname text; pn text; b record;
begin
  select role, mgr, name into reqrole, reqmgr, reqname from public.profiles where id = new.requester_id;
  select name into pn from public.products where id = new.product_id;
  if reqrole = 'commercial' and reqmgr is not null then
    perform public.notify(reqmgr, '📥 Demande de stock',
      coalesce(reqname,'Un commercial') || ' demande ' || new.qty || ' × ' || coalesce(pn,'produit'),
      'demande', 'demandes', new.id);
  elsif reqrole = 'responsable' then
    for b in select id from public.profiles where role = 'boss' and status = 'actif' loop
      perform public.notify(b.id, '📥 Demande de stock',
        coalesce(reqname,'Un responsable') || ' demande ' || new.qty || ' × ' || coalesce(pn,'produit'),
        'demande', 'demandes', new.id);
    end loop;
  end if;
  return new;
end; $$;
drop trigger if exists on_stock_request_notify on public.stock_requests;
create trigger on_stock_request_notify after insert on public.stock_requests
  for each row execute function public.notif_stock_request();

-- (e) Demande résolue (fait/refusé) → le demandeur est prévenu
create or replace function public.notif_stock_request_resolved()
returns trigger language plpgsql security definer set search_path = public as $$
declare pn text;
begin
  if new.status is distinct from old.status and new.status in ('fait','refusé') then
    select name into pn from public.products where id = new.product_id;
    perform public.notify(new.requester_id,
      case when new.status = 'fait' then '✅ Demande approuvée' else '❌ Demande refusée' end,
      'Votre demande de ' || new.qty || ' × ' || coalesce(pn,'produit') ||
        case when new.status = 'fait' then ' a été approuvée' else ' a été refusée' end,
      'demande', 'stock', new.id);
  end if;
  return new;
end; $$;
drop trigger if exists on_stock_request_resolved on public.stock_requests;
create trigger on_stock_request_resolved after update on public.stock_requests
  for each row execute function public.notif_stock_request_resolved();

-- (f) Vente à crédit → responsable du vendeur + direction
--     record_sale insère total=0 puis met à jour le total : on notifie
--     au passage 0 → montant (UPDATE), ou directement à l'INSERT si >0.
create or replace function public.notif_sale_credit()
returns trigger language plpgsql security definer set search_path = public as $$
declare sname text; smgr uuid; b record; msg text; fire boolean := false;
begin
  if new.pay <> 'crédit' then return new; end if;
  if tg_op = 'INSERT' then
    fire := (new.total > 0);
  elsif tg_op = 'UPDATE' then
    fire := (new.total > 0 and coalesce(old.total,0) = 0);
  end if;
  if not fire then return new; end if;

  select name, mgr into sname, smgr from public.profiles where id = new.seller_id;
  msg := coalesce(sname,'Un vendeur') || ' — ' || public.fmt_fcfa(new.total) ||
         coalesce(' (' || new.customer || ')', '');
  if smgr is not null then
    perform public.notify(smgr, '🧾 Vente à crédit', msg, 'vente', 'creances', new.id);
  end if;
  for b in select id from public.profiles where role = 'boss' and status = 'actif' loop
    perform public.notify(b.id, '🧾 Vente à crédit', msg, 'vente', 'creances', new.id);
  end loop;
  return new;
end; $$;
drop trigger if exists on_sale_credit_notify on public.sales;
create trigger on_sale_credit_notify after insert or update on public.sales
  for each row execute function public.notif_sale_credit();

-- (g) Demande de versement → la direction est prévenue
create or replace function public.notif_payout_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare mname text; b record;
begin
  select name into mname from public.profiles where id = new.member_id;
  for b in select id from public.profiles where role = 'boss' and status = 'actif' loop
    perform public.notify(b.id, '💸 Demande de versement',
      coalesce(mname,'Un membre') || ' demande son ' ||
        case when new.kind = 'commission' then 'versement de commission' else 'salaire' end,
      'versement', 'finances', new.id);
  end loop;
  return new;
end; $$;
drop trigger if exists on_payout_request_notify on public.payout_requests;
create trigger on_payout_request_notify after insert on public.payout_requests
  for each row execute function public.notif_payout_request();

-- (h) Versement effectué → le membre est prévenu
create or replace function public.notif_payout()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify(new.member_id, '💵 Versement reçu',
    (case when new.kind = 'commission' then 'Commission' else 'Salaire' end) || ' : ' || public.fmt_fcfa(new.amount),
    'versement', 'accueil', new.id);
  return new;
end; $$;
drop trigger if exists on_payout_notify on public.payouts;
create trigger on_payout_notify after insert on public.payouts
  for each row execute function public.notif_payout();

-- (i) Stock terrain faible (≤ 3) → le porteur est prévenu
create or replace function public.notif_low_holding()
returns trigger language plpgsql security definer set search_path = public as $$
declare pn text;
begin
  if new.qty > 0 and new.qty <= 3 and (old.qty is null or old.qty > 3) then
    select name into pn from public.products where id = new.product_id;
    perform public.notify(new.holder_id, '⚠️ Stock faible',
      'Il vous reste ' || new.qty || ' × ' || coalesce(pn,'produit'),
      'alerte', 'stock', new.product_id);
  end if;
  return new;
end; $$;
drop trigger if exists on_holding_low_notify on public.holdings;
create trigger on_holding_low_notify after update on public.holdings
  for each row execute function public.notif_low_holding();

-- ---------------------------------------------------------------------
-- 4) Envoi push à chaque notification (Edge Function "super-handler")
-- ---------------------------------------------------------------------
create or replace function public.notify_push_notification()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url     := 'https://cwfwzwiuhjuyiaaqmhmu.supabase.co/functions/v1/super-handler',
    headers := jsonb_build_object('Content-Type','application/json'),
    body    := jsonb_build_object('type','INSERT','table','notifications','record', to_jsonb(new))
  );
  return new;
end; $$;
drop trigger if exists on_new_notification on public.notifications;
create trigger on_new_notification after insert on public.notifications
  for each row execute function public.notify_push_notification();
