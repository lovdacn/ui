// Canonical browser-safe preset catalog plus create-page display swatches.
export * from './generated/preset-catalog'

import type { PresetBaseColor, PresetTheme } from './generated/preset-catalog'

export const COLOR_SWATCHES: Record<PresetBaseColor, string> = {
  zinc: '#71717a',
  slate: '#64748b',
  stone: '#78716c',
  gray: '#6b7280',
  neutral: '#737373',
  taupe: '#8b7d6b',
  mauve: '#8b668b',
  olive: '#6b8e6b',
  mist: '#6b8e8e',
}

export const THEME_SWATCHES: Record<PresetTheme, string> = {
  zinc: '#52525b',
  slate: '#475569',
  stone: '#57534e',
  gray: '#4b5563',
  neutral: '#525252',
  red: '#dc2626',
  orange: '#ea580c',
  amber: '#d97706',
  yellow: '#ca8a04',
  lime: '#65a30d',
  green: '#16a34a',
  emerald: '#059669',
  teal: '#0d9488',
  cyan: '#0891b2',
  sky: '#0284c7',
  blue: '#2563eb',
  indigo: '#4f46e5',
  violet: '#7c3aed',
  purple: '#9333ea',
  fuchsia: '#c026d3',
  pink: '#db2777',
  rose: '#e11d48',
}
