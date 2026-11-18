Where Yale's supply meets Yale's demand.

# Boola Market

**y/cs × SpaceXSI Grokathon** · Yale · November 17, 2026  
Team: Jaywon, Casper, Justin

## Demo video

Demo video (1 min): docs/demo.mp4

[Watch the demo](docs/demo.mp4)

## What it does

### Yale-verified trusted accounts

Sign-in accepts only `@yale.edu`. Other domains, including `med.yale.edu`, are rejected. In the default mock mode, a student enters that address and opens the magic link on the next screen. No email is sent. A new address sets a name, a residential college, and a class year before the account can buy or sell. Every profile shows that college and class year as a Verified Yalie badge, so the person on the other side of a deal is a student, not an anonymous handle.

### Auction house and fixed-price listings

A listing is either a fixed price or a live auction. Fixed-price shelves cover tickets, furniture, textbooks, electronics, clothing, and everything else. Auctions show a countdown, the bid history, and a minimum raise of $5. The seller cannot bid on their own lot. When the clock runs out, the high bidder is settled as the winner. The seeded Harvard–Yale pair is the live demo auction.

### Haggle by messaging sellers

On a fixed-price listing, Message seller opens a thread with that seller. The buyer can send an offer. The seller can accept, decline, or counter. An accepted offer becomes that buyer’s price and is what they use to record the purchase. Threads stay on the listing, and the inbox lists every conversation.

### Certified sellers with reviews

A seller is certified by a completed sale record, not a self-written bio. After an order is completed, only that buyer can leave one review: 1 to 5 stars and a short note. Profiles show the average rating, the written reviews, and completed sales. Listing cards and listing pages carry a compact trust badge with the same rating, so a buyer can read the seller before they message or bid.

### Resco-to-resco student courier delivery

A buyer can ask another student to walk a fixed-price purchase, or an auction they won, from the seller’s residential college to theirs. The quote is $3, $4, or $5 from the walk between colleges, with an ETA and a named courier. Students opt in on Couriers, accept an open walk, and see what they have earned.

### Tags and filters

Browse filters the shelves that matter on campus:

- **YSO tickets** — Woolsey and other Yale Symphony Orchestra seats (`/browse?event=yso`).
- **Harvard–Yale tickets** — student tickets and pairs for The Game (`/browse?event=harvard-yale`).
- **Senior move-out** — lofts, rugs, and the rest of a room that will not fit in the car home (`/browse?event=senior-move-out`, also linked from `/move-out`).

Those tags come from the campus events list. A ticket listing can also be typed as YSO, Harvard–Yale, concerts, or other. Senior move-out stays a flag, so a loft can be both furniture and move-out.

### Grok-powered listing writer

Sell opens a form. Add a photo or a few notes and choose Write it with Grok. The server action calls the xAI chat completions API and fills the title, description, category, condition, and a price grounded in comparable campus listings. `XAI_API_KEY` is read only on the server. It is never sent to the browser, returned in the draft, or logged. With no key, mock mode still writes the draft from those same local comps, so the form works for the demo.

## Built with Grok

All coding agents ran grok-4.7 in Cursor.

![Built with Grok 4.7 in Cursor](docs/built-with-grok.png)

## Tech stack

- Next.js 16 (App Router) and React 19
- TypeScript, Tailwind CSS 4, and shadcn/ui
- Zod for listing input
- Mock magic-link auth (`AUTH_PROVIDER=mock`) with an `@yale.edu` check. Supabase OTP is wired but not required.
- Local data in `data/store.json`, seeded from `src/lib/db/seed.ts`. The Postgres shape is in `db/migrations/`.
- xAI API for the listing writer (`XAI_API_KEY`, optional `XAI_MODEL`, default model `grok-4`), with a mock fallback when the key is empty

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3847](http://localhost:3847). The app works without a key in mock mode. `.env.example` already sets `AUTH_PROVIDER=mock` and `DATA_PROVIDER=local`. Leave `XAI_API_KEY` empty and Write it with Grok uses the local draft.

Demo path: sign in as Maya Chen, Jordan Hale, or Priya Shah (or any new `@yale.edu` address), open the magic link, then sell, browse, message, bid, or request a college-to-college walk. To reset, stop the server and delete `data/store.json`. Uploaded photos live in `public/uploads/`.

```bash
npm test
npm run lint
```
