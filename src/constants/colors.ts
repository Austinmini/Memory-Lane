/**
 * Dementia-friendly accessible color palette for Memory Lane.
 * Designed to meet WCAG AAA contrast ratios on text and touch elements.
 * Features calming earthy tones (Sage, Warm Cream, Deep Navy) to reduce
 * agitation, confusion, and sensory overload.
 */

export const Colors = {
  // Primary brand / calming nature tones
  primary: '#1E4D38',        // Deep Evergreen / Sage - grounding, high contrast
  primaryLight: '#E8F2EC',   // Soft mint tint for card backgrounds
  primaryMuted: '#2D5A47',   // Balanced sage for action buttons
  primaryPressed: '#163829', // Darker active state

  // Accent & attention colors (gentle, never alarming)
  accentWarm: '#B86B14',     // Warm Amber for non-intrusive reminders
  accentWarmLight: '#FEF6ED',// Cream amber for alerts
  accentBlue: '#2A5D88',     // Soothing sky slate for secondary actions
  accentBlueLight: '#EEF5FA',

  // Status & Routine Indicators
  success: '#1D6B42',        // Deep forest green for completed tasks
  successLight: '#E9F5EE',
  info: '#205B7A',           // Clear informational indicator
  infoLight: '#EBF4F9',

  // Neutrals & Readability Backgrounds (Warm cream to reduce screen glare)
  background: '#F9FAF8',     // Calming warm off-white (less harsh than pure #FFF)
  surface: '#FFFFFF',        // Pure white for card elevation
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F1F4F1',   // Subtle distinction for list rows

  // High-Contrast Typography (Exceeds WCAG AAA 7:1 ratio)
  textPrimary: '#141E18',    // Deep Charcoal Forest - near black with soft warmth
  textSecondary: '#3E4F45',  // Medium high-contrast charcoal green
  textMuted: '#5C7064',      // Supporting helper text (still passes AA)
  textInverse: '#FFFFFF',    // White text on dark buttons

  // Borders & Dividers (Defined borders aid visual perception for cognitive impairment)
  border: '#CCD6CE',         // Sturdy, visible border for cards & inputs
  borderStrong: '#94A698',   // Enhanced borders for active inputs
  borderLight: '#E4ECE6',

  // Interactive Target Aids
  focusRing: '#1E4D38',      // Accessible focus outline
  touchFeedback: '#D5E6DC',  // Obvious tap feedback
  disabled: '#A8B3AC',
  disabledSurface: '#E8ECE9',
} as const;

export type ColorName = keyof typeof Colors;
