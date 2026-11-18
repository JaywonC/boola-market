/**
 * Senior move-out is a campus event in src/lib/events.ts.
 * Listings carry event "senior-move-out" (and the older seniorMoveOut flag).
 * /move-out redirects to /browse?event=senior-move-out.
 */
export const MOVE_OUT_PLUGIN = {
  id: "move-out",
  entry: "src/lib/events.ts",
  browse: "/browse?event=senior-move-out",
} as const;
