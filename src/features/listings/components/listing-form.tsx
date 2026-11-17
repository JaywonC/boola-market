"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListingAssistantSlot } from "@/features/assistant/components/listing-assistant-slot";
import { createListing, type ListingActionState } from "@/features/listings/actions";
import { ListingArt } from "@/features/listings/components/listing-art";
import {
  CATEGORY_IDS,
  CATEGORY_LABELS,
  CONDITIONS,
  CONDITION_LABELS,
  TICKET_LABELS,
  TICKET_TYPES,
  type Category,
  type TicketType,
} from "@/lib/categories";

const fieldClass = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm";

const initialState: ListingActionState = { error: "", fieldErrors: {} };

export function ListingForm() {
  const [state, action, pending] = useActionState(createListing, initialState);
  const [category, setCategory] = useState<Category>("tickets");
  const [ticketType, setTicketType] = useState<TicketType>("harvard_yale");
  const [listingType, setListingType] = useState("fixed");
  const [title, setTitle] = useState("");

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        {state.error ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            minLength={4}
            maxLength={90}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Harvard–Yale student ticket, Yale Bowl"
            className="h-10 bg-card"
            aria-invalid={Boolean(state.fieldErrors.title)}
          />
          <FieldError message={state.fieldErrors.title} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            required
            minLength={20}
            rows={6}
            placeholder="Where it is, what condition it’s in, and how you’ll hand it off."
            className="min-h-32 bg-card"
            aria-invalid={Boolean(state.fieldErrors.description)}
          />
          <FieldError message={state.fieldErrors.description} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Price in dollars</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min={1}
              max={9999}
              step="1"
              required
              placeholder="90"
              className="h-10 bg-card"
              aria-invalid={Boolean(state.fieldErrors.price)}
            />
            <p className="text-xs text-muted-foreground">
              {listingType === "auction" ? "This is the starting bid." : "What you’re asking."}
            </p>
            <FieldError message={state.fieldErrors.price} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <select id="condition" name="condition" className={fieldClass} defaultValue="good">
              {CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {CONDITION_LABELS[condition]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              className={fieldClass}
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
            >
              {CATEGORY_IDS.map((item) => (
                <option key={item} value={item}>
                  {CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
          </div>
          {category === "tickets" ? (
            <div className="space-y-2">
              <Label htmlFor="ticketType">Ticket type</Label>
              <select
                id="ticketType"
                name="ticketType"
                className={fieldClass}
                value={ticketType}
                onChange={(event) => setTicketType(event.target.value as TicketType)}
              >
                {TICKET_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {TICKET_LABELS[item]}
                  </option>
                ))}
              </select>
              <FieldError message={state.fieldErrors.ticketType} />
            </div>
          ) : (
            <input type="hidden" name="ticketType" value="" />
          )}
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Listing type</legend>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="listingType"
                value="fixed"
                checked={listingType === "fixed"}
                onChange={() => setListingType("fixed")}
              />
              Fixed price
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="listingType"
                value="auction"
                checked={listingType === "auction"}
                onChange={() => setListingType("auction")}
              />
              Auction
            </label>
          </div>
          {listingType === "auction" ? (
            <div className="space-y-2">
              <Label htmlFor="auctionEndsAt">Auction ends</Label>
              <Input
                id="auctionEndsAt"
                name="auctionEndsAt"
                type="datetime-local"
                required
                className="h-10 bg-card"
                aria-invalid={Boolean(state.fieldErrors.auctionEndsAt)}
              />
              <FieldError message={state.fieldErrors.auctionEndsAt} />
            </div>
          ) : null}
        </fieldset>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="seniorMoveOut" className="mt-1" />
          <span>
            Senior move-out. Use this for furniture and dorm stuff you’re leaving when you graduate.
          </span>
        </label>

        <div className="space-y-2">
          <Label htmlFor="photos">Photos</Label>
          <Input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="h-10 bg-card pt-1.5" />
          <p className="text-xs text-muted-foreground">Optional. Up to four images, 2 MB each. A ticket-style graphic shows if you skip this.</p>
          <FieldError message={state.fieldErrors.photos} />
        </div>

        <ListingAssistantSlot />

        <Button type="submit" disabled={pending} className="h-10 px-4">
          {pending ? "Publishing…" : "Publish listing"}
        </Button>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Preview</p>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ListingArt
            category={category}
            ticketType={category === "tickets" ? ticketType : null}
            title={title || "Your listing"}
          />
          <div className="p-4">
            <p className="font-serif text-lg text-yale">{title || "Your listing title"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {category === "tickets" ? TICKET_LABELS[ticketType] : CATEGORY_LABELS[category]}
              {listingType === "auction" ? " · Auction" : ""}
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}
