/**
 * Piano Leather & Fur — Design System Types
 */

export type ColorToken = "black" | "gold" | "ivory" | "cardBg" | "white" | "gray" | "border";

export type SpacingStep = 1 | 2 | 3 | 4 | 6 | 8 | 12;

export type BreakpointKey = "mobile" | "tablet" | "laptop" | "desktop" | "ultraWide";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export type CardVariant = "flat" | "minimal" | "hover";

export type MotionPreset = "fadeIn" | "fadeUp" | "fadeDown" | "staggerItem";

export type Language = "TR" | "RU" | "EN" | "DE" | "PL";

export interface DesignToken {
  name: string;
  value: string;
  cssVar: string;
  description?: string;
}

export interface TypographyScale {
  name: string;
  family: "heading" | "body";
  size: string;
  weight: number;
  lineHeight: number;
  tracking?: string;
}
