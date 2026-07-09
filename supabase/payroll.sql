-- =====================================================================
-- ZKA — Paie : salaires, commissions à percevoir, demandes & versements
-- À exécuter dans Supabase → SQL Editor (après permissions.sql / commission.sql).
-- Idempotent.
-- =====================================================================

-- Champs profil : salaire mensuel + date du dernier versement de commission
alter table public.profiles add column if not exists salary numeric not null default 0;
alter table public.profiles add column if not exists comm_paid_at timestamptz;
update public.profiles set comm_paid_at = coalesce(comm_paid_at, created_at, now());

-- Historique des versements (commissions & salaires payés)
create table if not exists public.payouts (
  id        uuid primary key default gen_random_uuid(),
  member_id uuid references public.profiles(id) on delete set null,
  kind      text not null check (kind in ('commission','salaire')),
  amount    numeric not null default 0,
  note      text,
  paid_at   timestamptz not null default now(),
  paid_by   uuid references public.profiles(id) on delete set null
);
alter table public.payouts enable row level security;
grant select, insert, update, delete on public.payouts to authenticated;
drop policy if exists "payouts_read" on public.payouts;
create policy "payouts_read" on public.payouts for select to authenticated using (
  member_id = auth.uid()
  or public.my_role() = 'boss'
  or exists (select 1 from public.profiles p where p.id = payouts.member_id and p.mgr = auth.uid())
);

-- Demandes de versement faites par les membres
create table if not exists public.payout_requests (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid references public.profiles(id) on delete cascade,
  kind         text not null check (kind in ('commission','salaire')),
  amount       numeric not null default 0,
  status       text not null default 'en_attente' check (status in ('en_attente','payé','refusé')),
  requested_at timestamptz not null default now(),
  resolved_at  timestamptz
);
alter table public.payout_requests enable row level security;
grant select, insert, update, delete on public.payout_requests to authenticated;
drop policy if exists "preq_read" on public.payout_requests;
create policy "preq_read" on public.payout_requests for select to authenticated using (
  member_id = auth.uid()
  or public.my_role() = 'boss'
  or exists (select 1 from public.profiles p where p.id = payout_requests.member_id and p.mgr = auth.uid())
);
drop policy if exists "preq_insert_self" on public.payout_requests;
create policy "preq_insert_self" on public.payout_requests for insert to authenticated with check (member_id = auth.uid());

-- Un membre demande un versement (commission ou salaire)
create or replace function public.request_payout(p_kind text, p_amount numeric)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  if p_kind not in ('commission','salaire') then raise exception 'Type invalide'; end if;
  insert into public.payout_requests(member_id, kind, amount)
    values (auth.uid(), p_kind, greatest(0, coalesce(p_amount, 0)))
    returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.request_payout(text, numeric) to authenticated;

-- Le président paie un membre ; une commission remet le compteur à zéro
create or replace function public.pay_member(p_member uuid, p_kind text, p_amount numeric, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_president() then raise exception 'Réservé au président'; end if;
  if p_kind not in ('commission','salaire') then raise exception 'Type invalide'; end if;
  insert into public.payouts(member_id, kind, amount, note, paid_by)
    values (p_member, p_kind, greatest(0, coalesce(p_amount, 0)), p_note, auth.uid());
  if p_kind = 'commission' then
    update public.profiles set comm_paid_at = now() where id = p_member;  -- réinitialise la commission
  end if;
  update public.payout_requests set status = 'payé', resolved_at = now()
    where member_id = p_member and kind = p_kind and status = 'en_attente';
end; $$;
grant execute on function public.pay_member(uuid, text, numeric, text) to authenticated;

-- Le président fixe le salaire mensuel d'un membre
create or replace function public.admin_set_salary(p_target uuid, p_salary numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_president() then raise exception 'Réservé au président'; end if;
  update public.profiles set salary = greatest(0, coalesce(p_salary, 0)) where id = p_target;
end; $$;
grant execute on function public.admin_set_salary(uuid, numeric) to authenticated;

do $$ begin alter publication supabase_realtime add table public.payouts; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.payout_requests; exception when duplicate_object then null; end $$;
