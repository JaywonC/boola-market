# Yale Marketplace

A trusted marketplace for Yale students. Every account is an `@yale.edu` address, and every seller has a residential college, a class year, and a rating from completed sales. The shelves that matter first are the ones anonymous feeds never quite manage: YSO Halloween, Harvard–Yale at the Bowl, and the loft someone has to get out of Morse before May.

Auth, browse, listing detail, create listing, profiles, haggling chat, the Grok listing assistant, live auctions, and resco-to-resco delivery work in local demo mode. A deeper move-out section is the remaining plug-in.

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
3. **Sell** opens the form. Add a photo or a few words, choose **Write it with Grok**, then edit the draft and publish. It shows up in Browse and on your profile. Without `XAI_API_KEY`, the draft still uses comparable campus listings.
4. Open a listing, then the seller’s name, to see rating and completed sales.
5. On a fixed-price listing, choose **Deliver to my college**. The fee is $3, $4, or $5 by the walk between colleges, with an ETA and a named courier.
6. Open **Couriers** to opt in, accept an open walk, and see earnings.
7. The Harvard–Yale pair auction shows a live countdown and bid history. The minimum raise is $5, and the auction ends a few hours after the store is seeded.

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
| `XAI_API_KEY` | Optional server-only secret. When set, **Write it with Grok** calls the xAI chat completions API at `https://api.x.ai/v1`. When empty, the form fills from comparable listings in the local store. The key is read only in `src/features/assistant/env.server.ts` and is never sent to the browser, returned, or logged. |
| `XAI_MODEL` | Optional model id for that call. Defaults to `grok-4`. Also server-only. |

`XAI_API_KEY` must not use a public browser prefix. Copy it into `.env.local` (gitignored) and leave `.env.example` empty.

`AUTH_PROVIDER=supabase` will ask Supabase to email the link, then return through `src/app/auth/callback/route.ts`. That route still needs the code exchange before it can create a session. Until then, use `mock`.

Only addresses that end in `@yale.edu` are accepted, in either mode. `med.yale.edu` and other domains are rejected.

## Folder structure

```
src/app/                      routes (home, browse, listing, create, profile, login, move-out, couriers)
src/components/ui/            shadcn primitives
src/components/layout/        header, footer, mobile nav
src/features/auth/            @yale.edu check, mock magic link, Supabase sender
src/features/listings/        cards, create form, listing art
src/features/auctions/        live countdown, bid form, polling, winner settlement
src/features/messages/        thread preview, sendMessage action
src/features/reviews/         review rules and reviewSeller action
src/features/orders/          order rules and recordOrder action
src/features/profiles/        seller row and stars
src/features/delivery/        college-to-college fee, courier assignment, courier board
src/features/move-out/        move-out plug-in notes
src/features/assistant/       Grok listing writer slot
src/lib/db/                   types, seed, JSON store, queries
db/migrations/                Postgres schema, including delivery and auction winners
```

Pages stay thin. Feature code stays in `src/features/<name>` so later work can land in parallel without sharing one giant component.

## Data model

`db/migrations/001_init.sql` is the schema. The running demo uses the same shape in `data/store.json`, seeded from `src/lib/db/seed.ts`.

- **profiles** — name, residential college, graduation year, avatar, `@yale.edu` email
- **listings** — title, description, price, category, photos, condition, fixed price or auction, status, seller, senior move-out flag, auction end, auction winner
- **bids** — bidder, amount, time, on an auction listing. Each raise is at least $5.
- **conversations / messages** — buyer to seller on a listing
- **orders** — agreed sale, pending / completed / cancelled
- **reviews** — the buyer’s rating of the seller after a completed order
- **couriers / deliveries** — a student who walks an order from the seller’s college to the buyer’s. Fee is $3, $4, or $5 by distance.

Categories are Tickets (YSO, Harvard–Yale, concerts, other), Furniture, Textbooks, Electronics, Clothing, and Other. Senior move-out is a flag, so a loft can be both Furniture and move-out.

## Where the next features plug in

- **Live auctions.** `AuctionSection` on the listing page shows a ticking countdown and polls `GET /api/auctions/[listingId]` every few seconds. `placeBid` rejects raises under $5. `settleExpiredAuctions` marks the winner when the clock runs out. The seeded Harvard–Yale pair (`lst_game_pair`) ends about four hours after the store is seeded.
- **Haggling chat.** From a fixed-price listing, Message seller opens `/messages`. Buyers send an offer, and the seller can accept, decline, or counter. An accepted offer is that buyer’s price and lets them record the purchase. The thread polls in local mode.
- **Seller reviews.** After a completed order, the buyer leaves 1 to 5 stars and a short note from the seller’s profile or that listing. `reviewSeller` in `src/features/reviews/actions.ts` allows only that buyer, and only once. Profiles show the average, the written reviews, completed sales, and a Verified Yalie badge (college and class year). Listing cards and listing pages show a compact trust badge. Jordan Hale still owes Maya Chen a review of the beanie, which is the demo write path.
- **Resco-to-resco delivery.** On a fixed-price listing, or after you win an auction, `DeliveryOffer` quotes a $3–$5 fee, an ETA, and a student courier. `/couriers` is where a student opts in, accepts open walks, and sees earnings.
- **Senior move-out.** `listings.seniorMoveOut` is live. Browse has the filter, and `/move-out` is the section. Scheduling, bundle splits, and a May countdown belong in `src/features/move-out`.
- **Grok listing writing and price suggestions.** `ListingAssistantSlot` sits at the top of the create form. **Write it with Grok** calls `writeListingWithGrok`, which reads `XAI_API_KEY` on the server, sends the photo and notes plus comparable listings, and fills the title, description, category, condition, and price. With no key, `buildMockDraft` does the same job from campus comps.
