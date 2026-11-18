-- Couriers, resco-to-resco deliveries, and the auction winner.
-- Apply after 001_init.sql.

alter table listings
  add column if not exists auction_winner_id text references profiles (id);

create table if not exists couriers (
  user_id text primary key references profiles (id),
  active boolean not null default true,
  rating numeric,
  created_at timestamptz not null default now(),
  constraint courier_rating check (rating is null or (rating >= 1 and rating <= 5))
);

create table if not exists deliveries (
  id text primary key,
  order_id text not null references orders (id),
  listing_id text not null references listings (id),
  buyer_id text not null references profiles (id),
  seller_id text not null references profiles (id),
  from_college text not null,
  to_college text not null,
  fee_cents integer not null,
  eta_minutes integer not null,
  courier_id text references profiles (id),
  status text not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint delivery_fee check (fee_cents between 300 and 500),
  constraint delivery_eta check (eta_minutes between 10 and 90),
  constraint delivery_status check (status in ('open', 'accepted', 'completed', 'cancelled')),
  constraint delivery_parties check (buyer_id <> seller_id)
);

create index if not exists deliveries_status_idx on deliveries (status, created_at);
create index if not exists deliveries_courier_idx on deliveries (courier_id);

alter table couriers enable row level security;
alter table deliveries enable row level security;

create policy couriers_read on couriers for select using (true);
create policy deliveries_read on deliveries for select using (true);
