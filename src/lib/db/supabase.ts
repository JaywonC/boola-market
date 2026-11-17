/**
 * Supabase data provider plug-in.
 *
 * When DATA_PROVIDER=supabase, implement the same operations as src/lib/db/store.ts
 * against the tables in db/migrations/001_init.sql. The local JSON store stays the
 * default so the demo runs with no credentials.
 */
export function supabaseNotReady(): never {
  throw new Error(
    "DATA_PROVIDER=supabase is set, but the Supabase store is not wired yet. Implement src/lib/db/supabase.ts or unset DATA_PROVIDER to use the local JSON store.",
  );
}
