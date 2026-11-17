/** Keep these emails present in src/lib/db/seed.ts so the login page can open a known student. */
export const DEMO_ACCOUNTS = [
  {
    email: "maya.chen@yale.edu",
    name: "Maya Chen",
    detail: "Grace Hopper ’27 · seller with reviews",
  },
  {
    email: "jordan.hale@yale.edu",
    name: "Jordan Hale",
    detail: "Timothy Dwight ’27 · The Game auction",
  },
  {
    email: "priya.shah@yale.edu",
    name: "Priya Shah",
    detail: "Silliman ’27 · senior move-out",
  },
] as const;
