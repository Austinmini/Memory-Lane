/**
 * Typography scale and layout guidelines optimized for dementia care & elders.
 * Key rules:
 * - Minimum body text size >= 18pt to assist low-vision users.
 * - Minimum touch targets >= 56dp for easy tap-ability without tremors causing misses.
 * - Generous line heights to avoid text crowding.
 * - High readability sans-serif font weights.
 */

import { TextStyle } from 'react-native';

export const Typography = {
  // Ultra-large orientation headers ("Thursday Morning", Clock)
  clock: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    letterSpacing: 0.5,
  } as TextStyle,

  orientationDay: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: 0.25,
  } as TextStyle,

  orientationDate: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
  } as TextStyle,

  // Section and Card Headings
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  } as TextStyle,

  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  } as TextStyle,

  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  } as TextStyle,

  // Body & Memory Story Reading (Generous sizing for effortless readability)
  bodyLarge: {
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 32,
  } as TextStyle,

  body: {
    fontSize: 19,
    fontWeight: '400',
    lineHeight: 28,
  } as TextStyle,

  bodyMediumBold: {
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 28,
  } as TextStyle,

  // Interactive buttons (Large minimum targets)
  buttonLarge: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  } as TextStyle,

  button: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  } as TextStyle,

  // Relationship Badges & Meta Tags
  badge: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.5,
  } as TextStyle,

  caption: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  } as TextStyle,
} as const;

export const TouchTargets = {
  minHeight: 56,     // Minimum accessible button height in dp
  minWidth: 56,      // Minimum accessible button width in dp
  largeButton: 68,   // High-confidence primary button height (e.g. "Listen", "Done")
  iconSizeLarge: 36,
  iconSizeMedium: 28,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
} as const;
