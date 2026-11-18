-- Boola Market foundation schema.
-- Matches the TypeScript model in src/lib/db/types.ts.
-- Primary keys are text so the local demo ids (usr_maya, lst_game_student)
-- and future Supabase ids can share one shape. When AUTH_PROVIDER=supabase,
-- profiles.id should be the auth user id.

create table if not exists profiles (
  id text primary key,
  email text not null unique,
  name text not null,
  college text not null,
  graduation_year integer not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint yale_email check (email ~* '^[^@[:space:]]+@yale\.edu$'),
  constraint graduation_year_range check (graduation_year between 2020 and 2040)
);

create table if not exists listings (
  id text primary key,
  seller_id text not null references profiles (id),
  title text not null,
  description text not null,
  price_cents integer not null,
  category text not null,
  ticket_type text,
  photos text[] not null default '{}',
  condition text not null,
  listing_type text not null,
  status text not null default 'active',
  senior_move_out boolean not null default false,
  auction_ends_at timestamptz,
  created_at timestamptz not null default now(),
  constraint price_positive check (price_cents > 0),
  constraint category_known check (
    category in ('tickets', 'furniture', 'textbooks', 'electronics', 'clothing', 'other')
  ),
  constraint ticket_type_known check (
    ticket_type is null or ticket_type in ('yso', 'harvard_yale', 'concerts', 'other')
  ),
  constraint tickets_have_a_type check (
    (category = 'tickets' and ticket_type is not null)
    or (category <> 'tickets' and ticket_type is null)
  ),
  constraint condition_known check (condition in ('new', 'like_new', 'good', 'fair')),
  constraint listing_type_known check (listing_type in ('fixed', 'auction')),
  constraint listing_status_known check (status in ('active', 'sold', 'cancelled')),
  constraint auction_has_end check (
    (listing_type = 'auction' and auction_ends_at is not null)
    or (listing_type = 'fixed' and auction_ends_at is null)
  )
);

create index if not exists listings_seller_idx on listings (seller_id);
create index if not exists listings_category_idx on listings (category, status);
create index if not exists listings_move_out_idx on listings (senior_move_out) where senior_move_out;

create table if not exists bids (
  id text primary key,
  listing_id text not null references listings (id),
  bidder_id text not null references profiles (id),
  amount_cents integer not null,
  created_at timestamptz not null default now(),
  constraint bid_positive check (amount_cents > 0)
);

create index if not exists bids_listing_idx on bids (listing_id, amount_cents desc);

create table if not exists conversations (
  id text primary key,
  listing_id text not null references listings (id),
  buyer_id text not null references profiles (id),
  seller_id text not null references profiles (id),
  created_at timestamptz not null default now(),
  constraint conversation_parties check (buyer_id <> seller_id),
  unique (listing_id, buyer_id)
);

create table if not exists messages (
  id text primary key,
  conversation_id text not null references conversations (id),
  sender_id text not null references profiles (id),
  body text not null,
  created_at timestamptz not null default now(),
  constraint message_body check (char_length(btrim(body)) between 1 and 2000)
);

create index if not exists messages_conversation_idx on messages (conversation_id, created_at);

create table if not exists orders (
  id text primary key,
  listing_id text not null references listings (id),
  buyer_id text not null references profiles (id),
  seller_id text not null references profiles (id),
  price_cents integer not null,
  status text not null,
  created_at timestamptz not null default now(),
  constraint order_price check (price_cents > 0),
  constraint order_parties check (buyer_id <> seller_id),
  constraint order_status_known check (status in ('pending', 'completed', 'cancelled'))
);

create index if not exists orders_seller_idx on orders (seller_id, status);
create index if not exists orders_buyer_idx on orders (buyer_id);

create table if not exists reviews (
  id text primary key,
  order_id text not null unique references orders (id),
  reviewer_id text not null references profiles (id),
  seller_id text not null references profiles (id),
  rating integer not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  constraint rating_range check (rating between 1 and 5),
  constraint reviewer_is_not_seller check (reviewer_id <> seller_id)
);

create index if not exists reviews_seller_idx on reviews (seller_id);

-- Supabase row level security, ready for when the data provider is swapped.
-- The local JSON store does not enforce these policies.
alter table profiles enable row level security;
alter table listings enable row level security;
alter table bids enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table orders enable row level security;
alter table reviews enable row level security;

-- Readable marketplace. Writes stay with the signed-in owner of the row.
-- Replace `true` with auth.uid()::text = id once profiles.id is the auth user id.
create policy profiles_read on profiles for select using (true);
create policy listings_read on listings for select using (true);
create policy bids_read on bids for select using (true);
create policy reviews_read on reviews for select using (true);
