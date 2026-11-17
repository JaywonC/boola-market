export const COLLEGES = [
  "Berkeley",
  "Branford",
  "Davenport",
  "Ezra Stiles",
  "Jonathan Edwards",
  "Benjamin Franklin",
  "Grace Hopper",
  "Morse",
  "Pauli Murray",
  "Pierson",
  "Saybrook",
  "Silliman",
  "Timothy Dwight",
  "Trumbull",
] as const;

export type College = (typeof COLLEGES)[number];

export function isCollege(value: string): value is College {
  return (COLLEGES as readonly string[]).includes(value);
}

/** Display colors for avatars. These are not official college heraldry. */
export const COLLEGE_COLORS: Record<College, string> = {
  Berkeley: "#7a2430",
  Branford: "#1f5a45",
  Davenport: "#3d4c7a",
  "Ezra Stiles": "#8a4b12",
  "Jonathan Edwards": "#1e3f66",
  "Benjamin Franklin": "#5c3d73",
  "Grace Hopper": "#0f4c81",
  Morse: "#3f5c3a",
  "Pauli Murray": "#6b2d4a",
  Pierson: "#8c3b2a",
  Saybrook: "#204e78",
  Silliman: "#6a5424",
  "Timothy Dwight": "#243e34",
  Trumbull: "#4a3b28",
};
