"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeMagicLink, type AuthState } from "@/features/auth/actions";
import { COLLEGES } from "@/lib/colleges";

const initial: AuthState = { error: "" };
const years = [2026, 2027, 2028, 2029, 2030];

export function CheckForm({ existing }: { existing: boolean }) {
  const [state, action, pending] = useActionState(completeMagicLink, initial);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      {state.error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {existing ? null : (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required autoComplete="name" placeholder="Maya Chen" className="h-10 bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="college">Residential college</Label>
            <select id="college" name="college" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" defaultValue="">
              <option value="" disabled>
                Choose your college
              </option>
              {COLLEGES.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="graduationYear">Class year</Label>
            <select id="graduationYear" name="graduationYear" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" defaultValue="2027">
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      <Button type="submit" disabled={pending} className="h-10 px-4">
        {pending ? "Signing in…" : "Open the magic link"}
      </Button>
    </form>
  );
}
