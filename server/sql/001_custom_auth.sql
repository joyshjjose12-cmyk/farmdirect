-- =====================================================================
-- FarmDirect: own login system (replaces Supabase Auth)
-- Run ONCE against the database (Supabase SQL editor or psql). Safe to re-run.
-- =====================================================================

-- 1) Credentials table: one bcrypt hash per user ------------------------
create table if not exists public.user_credentials (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- 2) profiles.id gets its own default (it used to come from auth.users) -
alter table public.profiles alter column id set default gen_random_uuid();

-- 3) Drop any foreign keys that point at the Supabase-owned auth schema,
--    then point them at public.profiles instead.
do $$
declare c record;
begin
  for c in
    select con.conrelid::regclass as tbl, con.conname
    from pg_constraint con
    join pg_class ref on ref.oid = con.confrelid
    join pg_namespace ns on ns.oid = ref.relnamespace
    where con.contype = 'f'
      and ns.nspname = 'auth'
      and con.connamespace = 'public'::regnamespace
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'listings_farmer_id_profiles_fk') then
    alter table public.listings add constraint listings_farmer_id_profiles_fk
      foreign key (farmer_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bids_buyer_id_profiles_fk') then
    alter table public.bids add constraint bids_buyer_id_profiles_fk
      foreign key (buyer_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_buyer_id_profiles_fk') then
    alter table public.orders add constraint orders_buyer_id_profiles_fk
      foreign key (buyer_id) references public.profiles(id) on delete cascade;
  end if;
exception when others then
  raise notice 'Could not add one of the profile foreign keys: %', sqlerrm;
end $$;

-- 4) Keep existing accounts working: copy the bcrypt hashes Supabase Auth stored
do $$
begin
  if to_regclass('auth.users') is not null then
    insert into public.user_credentials (user_id, password_hash)
    select u.id, u.encrypted_password
    from auth.users u
    join public.profiles p on p.id = u.id
    where u.encrypted_password is not null and u.encrypted_password <> ''
    on conflict (user_id) do nothing;
  end if;
end $$;

-- 5) Helpful indexes for the queries the API runs ----------------------
create index if not exists bids_listing_idx    on public.bids(listing_id);
create index if not exists bids_buyer_idx      on public.bids(buyer_id);
create index if not exists listings_farmer_idx on public.listings(farmer_id);
create index if not exists orders_buyer_idx    on public.orders(buyer_id);
create index if not exists orders_listing_idx  on public.orders(listing_id);
create index if not exists transport_logs_order_idx on public.transport_logs(order_id, logged_at desc);
