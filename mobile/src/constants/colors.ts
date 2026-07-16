export const Colors = {
  // Light Theme Palette
  background: '#F6F8F9', // Soft Cream/White (Main Background)
  surface: '#FFFFFF',    // Pure White (Cards)

  primary: '#749F82',    // Sage Green (Buttons, Accents)
  primaryTint: '#E6F4EA', // Light sage — icon-circle backgrounds behind Colors.primary icons
  secondary: '#A8E6CF',  // Mint Green
  accentBlue: '#A1C4FD', // Soft Blue (Meditation Card)

  textPrimary: '#2D3436', // Dark Slate Gray (Headings)
  textSecondary: '#636E72', // Medium Gray (Body)
  textPlaceholder: '#B2BEC3',
  // Slate scale used for icon tints, help text and dividers on card-heavy screens
  // (Journey, Calendar, Profile, About Me) — named here instead of inline hex so
  // it's one source of truth rather than the same five values retyped per screen.
  textMuted: '#94A3B8',
  iconMuted: '#64748B',
  surfaceMuted: '#F1F5F9',
  borderLight: '#E2E8F0',

  border: '#DFE6E9',

  // Functional
  success: '#7ED1A6',
  warning: '#FD79A8', // Pinkish warn
  error: '#FF7675',

  gradients: {
    primary: ['#749F82', '#5D856D'], // Sage Gradient
    blueMethods: ['#E3F2FD', '#BBDEFB'],
    darkCard: ['#4B4E6D', '#2D3436'], // For the grid cards
  },
};
