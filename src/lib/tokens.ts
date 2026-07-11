/**
 * Piano Leather & Fur — Design Tokens (TypeScript)
 * Single source of truth for programmatic token access.
 * All values mirror src/styles/theme.css CSS variables.
 */

export const colors = {
  black:   "#111111",
  gold:    "#C7A45A",
  ivory:   "#F7F3EC",
  cardBg:  "#1B1B1B",
  white:   "#F5F5F5",
  gray:    "#A3A3A3",
  border:  "#3A3A3A",
} as const;

export const typography = {
  fontHeading: "'Cormorant Garamond', Georgia, serif",
  fontBody:    "'Montserrat', system-ui, sans-serif",
  weightThin:     300,
  weightNormal:   400,
  weightMedium:   500,
  weightSemibold: 600,
} as const;

export const spacing = {
  1:  8,
  2:  16,
  3:  24,
  4:  32,
  6:  48,
  8:  64,
  12: 96,
} as const satisfies Record<number, number>;

export const layout = {
  containerMax: 1280,
  contentMax:   1180,
  containerPx:  32,
  columns:      12,
} as const;

export const border = {
  width:    1,
  radius:   12,
  radiusSm: 6,
  radiusLg: 16,
} as const;

export const motion = {
  fast: 150,
  base: 200,
  slow: 250,
  ease:    "cubic-bezier(0.4, 0, 0.2, 1)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
} as const;

export const breakpoints = {
  mobile:    0,
  tablet:    640,
  laptop:    1024,
  desktop:   1280,
  ultraWide: 1536,
} as const;
