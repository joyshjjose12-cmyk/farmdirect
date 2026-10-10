-- =====================================================================
-- FarmDirect: delivery feature migration
-- Run this ONCE in Supabase -> SQL Editor. Safe to re-run.
-- =====================================================================

-- 1) Allow a third role: 'delivery' ------------------------------------
do $$
declare
  col_type text;
  c record;
begin
  select udt_name into col_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles' and column_name = 'role';

  -- role is a Postgres enum -> add the new value
  if col_type is not null and col_type not in ('text', 'varchar', 'bpchar') then
    execute format('alter type public.%I add value if not exists %L', col_type, 'delivery');
  else
    -- role is text with a CHECK constraint -> replace it
    for c in
      select conname from pg_constraint
      where conrelid = 'public.profiles'::regclass
        and contype = 'c'
        and pg_get_constraintdef(oid) ilike '%role%'
    loop
      execute format('alter table public.profiles drop constraint %I', c.conname);
    end loop;
    alter table public.profiles
      add constraint profiles_role_check check (role in ('farmer', 'buyer', 'delivery'));
  end if;
end $$;

-- 2) Delivery columns on orders ----------------------------------------
alter table public.orders
  add column if not exists delivery_address   text,
  add column if not exists delivery_lat       double precision,
  add column if not exists delivery_lng       double precision,
  add column if not exists delivery_phone     text,
  add column if not exists delivery_notes     text,
  add column if not exists delivery_person_id uuid references public.profiles(id) on delete set null,
  add column if not exists claimed_at         timestamptz,
  add column if not exists picked_up_at       timestamptz,
  add column if not exists delivered_at       timestamptz;

create index if not exists orders_delivery_person_idx on public.orders(delivery_person_id);

-- 3) Helper: the signed-in user's role ---------------------------------
create or replace function public.my_role()
returns text
language sql stable security definer
set search_path = public
as $$ select role::text from public.profiles where id = auth.uid() $$;

-- 4) Read access (RLS) --------------------------------------------------
-- Delivery partners can see every order, plus the listing / profile info
-- they need to find the pickup and drop-off.
drop policy if exists "delivery reads orders" on public.orders;
create policy "delivery reads orders" on public.orders
  for select to authenticated using (public.my_role() = 'delivery');

drop policy if exists "delivery reads listings" on public.listings;
create policy "delivery reads listings" on public.listings
  for select to authenticated using (public.my_role() = 'delivery');

drop policy if exists "delivery reads profiles" on public.profiles;
create policy "delivery reads profiles" on public.profiles
  for select to authenticated using (public.my_role() = 'delivery');

-- Farmers can read orders placed on their own listings
drop policy if exists "farmer reads own listing orders" on public.orders;
create policy "farmer reads own listing orders" on public.orders
  for select to authenticated using (
    exists (select 1 from public.listings l
            where l.id = orders.listing_id and l.farmer_id = auth.uid())
  );

-- Buyers can read their own orders
drop policy if exists "buyer reads own orders" on public.orders;
create policy "buyer reads own orders" on public.orders
  for select to authenticated using (buyer_id = auth.uid());

-- Everyone involved in an order can see the delivery partner's name/phone
-- (only profiles of delivery partners assigned to one of your orders).
drop policy if exists "see assigned courier profile" on public.profiles;
create policy "see assigned courier profile" on public.profiles
  for select to authenticated using (
    exists (
      select 1 from public.orders o
      where o.delivery_person_id = profiles.id
        and (o.buyer_id = auth.uid()
             or exists (select 1 from public.listings l
                        where l.id = o.listing_id and l.farmer_id = auth.uid()))
    )
  );

-- 5) Write access: only through these functions -------------------------
-- (no one needs UPDATE rights on orders for delivery; each function checks
--  who is calling and which state transitions are allowed)

-- Buyer saves / edits the delivery address (until the parcel is picked up)
create or replace function public.set_delivery_address(
  p_order uuid, p_address text, p_lat double precision,
  p_lng double precision, p_phone text, p_notes text
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if coalesce(trim(p_address), '') = '' then
    raise exception 'Please enter a delivery address.';
  end if;
  update public.orders
     set delivery_address = trim(p_address),
         delivery_lat     = p_lat,
         delivery_lng     = p_lng,
         delivery_phone   = nullif(trim(p_phone), ''),
         delivery_notes   = nullif(trim(p_notes), '')
   where id = p_order
     and buyer_id = auth.uid()
     and stage::text in ('bid_accepted', 'harvest_scheduled');
  if not found then
    raise exception 'You can only change the address of your own order before it is picked up.';
  end if;
end $$;

-- Delivery partner takes a job  (bid_accepted -> harvest_scheduled)
create or replace function public.claim_delivery(p_order uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if public.my_role() <> 'delivery' then
    raise exception 'Only delivery partners can take deliveries.';
  end if;
  update public.orders
     set delivery_person_id = auth.uid(),
         stage = 'harvest_scheduled',
         claimed_at = now()
   where id = p_order
     and stage::text = 'bid_accepted'
     and delivery_person_id is null
     and delivery_address is not null;
  if not found then
    raise exception 'This delivery was already taken, or the buyer has not added an address yet.';
  end if;
end $$;

-- Delivery partner gives a job back  (harvest_scheduled -> bid_accepted)
create or replace function public.release_delivery(p_order uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.orders
     set delivery_person_id = null,
         stage = 'bid_accepted',
         claimed_at = null
   where id = p_order
     and delivery_person_id = auth.uid()
     and stage::text = 'harvest_scheduled';
  if not found then
    raise exception 'You can only release a delivery before you have picked it up.';
  end if;
end $$;

-- Delivery partner moves the parcel forward
--   harvest_scheduled -> out_for_delivery   (picked up from the farm)
--   out_for_delivery  -> delivered          (handed to the buyer)
create or replace function public.advance_delivery(p_order uuid, p_stage text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_stage = 'out_for_delivery' then
    update public.orders
       set stage = 'out_for_delivery', picked_up_at = now()
     where id = p_order and delivery_person_id = auth.uid()
       and stage::text = 'harvest_scheduled';
  elsif p_stage = 'delivered' then
    update public.orders
       set stage = 'delivered', delivered_at = now()
     where id = p_order and delivery_person_id = auth.uid()
       and stage::text = 'out_for_delivery';
  else
    raise exception 'Unknown delivery step.';
  end if;
  if not found then
    raise exception 'This delivery is not in the right state for that step.';
  end if;
end $$;

-- 5b) Live courier location -> your existing transport_logs table -------
alter table public.transport_logs enable row level security;

drop policy if exists "order parties read transport logs" on public.transport_logs;
create policy "order parties read transport logs" on public.transport_logs
  for select to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = transport_logs.order_id
        and (o.buyer_id = auth.uid()
             or o.delivery_person_id = auth.uid()
             or exists (select 1 from public.listings l
                        where l.id = o.listing_id and l.farmer_id = auth.uid()))
    )
  );

-- The assigned delivery partner appends a position while the parcel is on the road
create or replace function public.log_courier_location(
  p_order uuid, p_lat double precision, p_lng double precision, p_place text default null
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.orders
    where id = p_order and delivery_person_id = auth.uid()
      and stage::text = 'out_for_delivery'
  ) then
    raise exception 'Location can only be shared for your own delivery that is on the way.';
  end if;
  insert into public.transport_logs (order_id, latitude, longitude, last_location, logged_at)
  values (p_order, p_lat, p_lng, nullif(trim(p_place), ''), now());
end $$;

grant execute on function public.log_courier_location(uuid, double precision, double precision, text) to authenticated;

grant execute on function public.my_role()                                   to authenticated;
grant execute on function public.set_delivery_address(uuid, text, double precision, double precision, text, text) to authenticated;
grant execute on function public.claim_delivery(uuid)                        to authenticated;
grant execute on function public.release_delivery(uuid)                      to authenticated;
grant execute on function public.advance_delivery(uuid, text)                to authenticated;

-- 6) Live updates (optional but recommended) ----------------------------
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
         when undefined_object then null;
end $$;
