# Yale Marketplace

A trusted marketplace for Yale students. Every account is an `@yale.edu` address, and every seller has a residential college, a class year, and a rating from completed sales. The shelves that matter first are the ones anonymous feeds never quite manage: YSO Halloween, Harvard–Yale at the Bowl, and the loft someone has to get out of Morse before May.

This repository is the foundation. Auth, the data model, browse, listing detail, create listing, and profiles work in local demo mode. Live auctions, haggling chat, review submission, resco-to-resco delivery, a deeper move-out section, and Grok-written listings are left as clear plug-in points for the next passes.

## Built with Grok

This app was built with Grok models in Cursor.

![Built with Grok in Cursor](docs/built-with-grok.png)

The image above is a placeholder. Drop the team screenshot of Grok in Cursor on top of `docs/built-with-grok.png`.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3847](http://localhost:3847).

Demo path:

1. Choose **Sign in** and use a `@yale.edu` address, or pick Maya Chen, Jordan Hale, or Priya Shah on the sign-in page.
2. On the next screen, choose **Open the magic link**. No email is sent in demo mode. A new address asks for name, residential college, and class year.
3. **Sell** publishes a listing. It shows up in Browse and on your profile.
4. Open a listing, then the seller’s name, to see rating and completed sales.

To start over from the seed data, stop the server and delete `data/store.json`. Uploaded photos live in `public/uploads/`.

```bash
npm test
npm run lint
```

## Environment variables

Copy `.env.example` to `.env.local`. The app runs with none of them set.

| Variable | What it does |
| --- | --- |
| `AUTH_PROVIDER` | `mock` (default) confirms the magic link on the next screen. `supabase` sends a real magic link through the Supabase Auth OTP API. |
| `AUTH_SECRET` | HMAC secret for the session cookie. Local demo falls back to a development secret. Set a long random value anywhere else. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. Required only when `AUTH_PROVIDER=supabase`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key. Required only when `AUTH_PROVIDER=supabase`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Reserved for server-side data access. Not read yet. |
| `DATA_PROVIDER` | `local` (default) uses `data/store.json`. `supabase` is reserved and currently throws, so a half-wired database cannot silently replace the demo. |

`AUTH_PROVIDER=supabase` will ask Supabase to email the link, then return through `src/app/auth/callback/route.ts`. That route still needs the code exchange before it can create a session. Until then, use `mock`.

Only addresses that end in `@yale.edu` are accepted, in either mode. `med.yale.edu` and other domains are rejected.

## Folder structure

```
src/app/                      routes (home, browse, listing, create, profile, login, move-out)
src/components/ui/            shadcn primitives
src/components/layout/        header, footer, mobile nav
src/features/auth/            @yale.edu check, mock magic link, Supabase sender
src/features/listings/        cards, create form, listing art
src/features/auctions/        bid rules, bid history, placeBid action
src/features/messages/        thread preview, sendMessage action
src/features/reviews/         review rules and reviewSeller action
src/features/orders/          order rules and recordOrder action
src/features/profiles/        seller row and stars
src/features/delivery/        resco-to-resco stub
src/features/move-out/        move-out plug-in notes
src/features/assistant/       Grok listing writer slot
src/lib/db/                   types, seed, JSON store, queries
db/migrations/001_init.sql    Postgres schema, including Supabase RLS starters
```

Pages stay thin. Feature code stays in `src/features/<name>` so later work can land in parallel without sharing one giant component.

## Data model

`db/migrations/001_init.sql` is the schema. The running demo uses the same shape in `data/store.json`, seeded from `src/lib/db/seed.ts`.

- **profiles** — name, residential college, graduation year, avatar, `@yale.edu` email
- **listings** — title, description, price, category, photos, condition, fixed price or auction, status, seller, senior move-out flag, auction end
- **bids** — bidder, amount, time, on an auction listing
- **conversations / messages** — buyer to seller on a listing
- **orders** — agreed sale, pending / completed / cancelled
- **reviews** — the buyer’s rating of the seller after a completed order

Categories are Tickets (YSO, Harvard–Yale, concerts, other), Furniture, Textbooks, Electronics, Clothing, and Other. Senior move-out is a flag, so a loft can be both Furniture and move-out.

## Where the next features plug in

- **Live auctions.** Bid rows, the high bid, and `evaluateBid` already exist. History renders from `src/features/auctions/components/bid-list.tsx`. `placeBid` in `src/features/auctions/actions.ts` writes a validated bid. Add the form, the countdown, and live updates in this folder.
- **Haggling chat.** From a fixed-price listing, Message seller opens `/messages`. Buyers send an offer, and the seller can accept, decline, or counter. An accepted offer is that buyer’s price and lets them record the purchase. The thread polls in local mode.
- **Seller reviews.** Completed orders and reviews are in the seed, and the profile page renders rating plus completed sales. `reviewSeller` in `src/features/reviews/actions.ts` is the write path. Add the form after a completed order.
- **Resco-to-resco delivery.** `src/features/delivery` holds the handoff type. Colleges are already on every profile. Attach a handoff to an order, then show it on the listing page.
- **Senior move-out.** `listings.seniorMoveOut` is live. Browse has the filter, and `/move-out` is the section. Scheduling, bundle splits, and a May countdown belong in `src/features/move-out`.
- **Grok listing writing and price suggestions.** `ListingAssistantSlot` is mounted inside `src/features/listings/components/listing-form.tsx` and renders nothing. Replace `src/features/assistant/components/listing-assistant-slot.tsx` and keep the types in `src/features/assistant/index.ts`.
