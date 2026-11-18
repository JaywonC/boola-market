-- Optional campus event tag. Slugs match src/lib/events.ts.
alter table listings
  add column if not exists event text;

create index if not exists listings_event_idx on listings (event) where event is not null;
