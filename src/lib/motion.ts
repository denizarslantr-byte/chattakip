/**
 * Piano Leather & Fur — Motion Presets
 * Framer Motion variants for fade, opacity, and hover effects.
 * Range: 150–250 ms. No heavy animation.
 */

export const transition = {
  fast:    { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const },
  base:    { duration: 0.2,  ease: [0.4, 0, 0.2, 1] as const },
  slow:    { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
  easeOut: { duration: 0.2,  ease: [0, 0, 0.2, 1] as const },
} as const;

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: transition.base },
};

export const fadeUp = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transition.slow },
};

export const fadeDown = {
  hidden:  { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: transition.slow },
};

export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const staggerItem = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transition.base },
};

export const hoverLift = {
  whileHover: { y: -2, transition: transition.base },
};

export const hoverGold = {
  initial:    { opacity: 0.6 },
  whileHover: { opacity: 1, transition: transition.fast },
};
