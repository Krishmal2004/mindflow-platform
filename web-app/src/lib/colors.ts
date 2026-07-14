// Design System Colors — web-app's own palette (see src/pages/*.tsx COLOR constants,
// which are the actual source of truth per-page; this file mirrors them for reference).
export const Colors = {
  // Light Theme Palette
  background: '#F8FAF8',
  surface: '#FFFFFF',

  primary: '#0F9B71',      // Emerald
  secondary: '#7FC7A6',    // Muted emerald (disabled/loading states)
  accentBlue: '#3E7BFA',   // Sky blue (Weekly Whispers)
  accentPurple: '#7C5CE0', // Violet (Mindful Mirror)

  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  textPlaceholder: '#B2BEC3',

  border: '#DFE6E9',

  // Functional
  success: '#0F9B71',
  warning: '#EA8F00',
  error: '#E5573F',

  // Journey Step Colors
  journeyColors: {
    daily: { color: '#EA8F00', bg: '#FFF6E5' },   // Amber
    weekly: { color: '#3E7BFA', bg: '#E8F0FE' },  // Sky blue
    thrive: { color: '#0F9B71', bg: '#E7F9F1' },  // Emerald
    stress: { color: '#E5573F', bg: '#FDEEEB' },  // Coral
    mirror: { color: '#7C5CE0', bg: '#F2EEFC' },  // Violet
  },

  gradients: {
    primary: ['#0F9B71', '#0B7A59'],
    dashboard: ['#E7F9F1', '#F8FAF8', '#FFFFFF'],
    quote: ['#0F9B71', '#7C5CE0'],
  },
};
