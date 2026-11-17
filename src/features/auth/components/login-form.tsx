"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLink, type AuthState } from "@/features/auth/actions";
import { DEMO_ACCOUNTS } from "@/features/auth/demo-accounts";

const initial: AuthState = { error: "" };

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(requestMagicLink, initial);
  const [email, setEmail] = useState("");

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-serif text-2xl text-yale">Magic link</h2>
      <p className="mt-1 text-sm text-muted-foreground">We’ll only continue if the address ends in @yale.edu.</p>
      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="next" value={next} />
        {state.error ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">Yale email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="first.last@yale.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10 bg-background"
            aria-invalid={Boolean(state.error)}
          />
        </div>
        <Button type="submit" disabled={pending} className="h-10 px-4">
          {pending ? "Checking…" : "Email me a link"}
        </Button>
      </form>
      <div className="mt-6 border-t border-border pt-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Demo students</p>
        <ul className="mt-3 space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                onClick={() => setEmail(account.email)}
                className="w-full rounded-lg px-2 py-2 text-left hover:bg-muted"
              >
                <span className="block text-sm font-medium">{account.name}</span>
                <span className="block text-xs text-muted-foreground">{account.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
