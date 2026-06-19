/**
 * Design tokens — single source of truth dla kolorów i typografii.
 * Tailwind ma to samo w tailwind.config.js, te wartości to fallback dla:
 *   - StatusBar background
 *   - React Native komponentów bez className
 *   - SVG fill/stroke
 *   - Dynamiczne style (np. animacje Reanimated)
 */

export const colors = {
  cream: { DEFAULT: '#FAF7F2', dark: '#1F1B17' },
  surface: { DEFAULT: '#FFFFFF', dark: '#272320' },
  sage: { DEFAULT: '#7C9082', soft: '#DCE6DD', dark: '#5F6B62' },
  evergreen: { DEFAULT: '#3D5147', dark: '#2A382F' },
  terracotta: { DEFAULT: '#C97B5A', soft: '#F5DDD0', dark: '#8B4A2E' },
  blush: { DEFAULT: '#E8B4A0', soft: '#F8E4D8' },
  mustard: { DEFAULT: '#D4915B', soft: '#F2DEC2' },
  ink: { DEFAULT: '#2C3530', soft: '#5F6B62', faint: '#8F968F' },
  line: { DEFAULT: '#E5DFD3', strong: '#D8D2C5' },
  success: '#6B8E5A',
  warning: '#D4915B',
  danger: '#B85450',
  info: '#6A8AA8',
} as const;

export const fontSize = {
  hero: 32,
  title: 26,
  h1: 22,
  h2: 18,
  body: 15,
  small: 13,
  micro: 11,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  card: 14,
  hero: 20,
  pill: 999,
  frame: 36,
} as const;

export type ColorToken = typeof colors;
