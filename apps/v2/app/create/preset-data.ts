// Browser-safe preset encoding/decoding for the create page.
// Mirrors packages/lovda/src/preset/preset.ts

export const PRESET_STYLES = [
  "new-york",
  "default",
  "luma",
  "lyra",
  "maia",
  "mira",
  "nova",
  "rhea",
  "sera",
  "vega",
] as const

export const PRESET_BASE_COLORS = [
  "zinc",
  "slate",
  "stone",
  "gray",
  "neutral",
  "taupe",
  "mauve",
  "olive",
  "mist",
] as const

export const PRESET_THEMES = [
  "zinc",
  "slate",
  "stone",
  "gray",
  "neutral",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const

export const PRESET_CHART_COLORS = PRESET_THEMES

export const PRESET_FONTS = [
  "inter",
  "dm-sans",
  "nunito-sans",
  "figtree",
  "outfit",
  "manrope",
  "space-grotesk",
  "montserrat",
  "roboto",
  "raleway",
  "public-sans",
  "source-sans-3",
  "lora",
  "merriweather",
  "playfair-display",
  "jetbrains-mono",
  "space-mono",
  "fira-code",
  "noto-serif",
  "roboto-slab",
  "instrument-sans",
  "instrument-serif",
  "geist",
] as const

export const PRESET_ICON_LIBRARIES = [
  "lucide",
  "phosphor",
  "tabler",
  "expo",
  "heroicons",
] as const

export const PRESET_RADII = [
  "default",
  "none",
  "small",
  "medium",
  "large",
  "full",
] as const

export type PresetConfig = {
  style: (typeof PRESET_STYLES)[number]
  baseColor: (typeof PRESET_BASE_COLORS)[number]
  theme: (typeof PRESET_THEMES)[number]
  chartColor: (typeof PRESET_CHART_COLORS)[number]
  font: (typeof PRESET_FONTS)[number]
  iconLibrary: (typeof PRESET_ICON_LIBRARIES)[number]
  radius: (typeof PRESET_RADII)[number]
}

const DEFAULT_PRESET_CONFIG: PresetConfig = {
  style: "new-york",
  baseColor: "zinc",
  theme: "zinc",
  chartColor: "blue",
  font: "inter",
  iconLibrary: "lucide",
  radius: "default",
}

const PRESET_FIELDS_V1 = [
  { key: "style", values: PRESET_STYLES, bits: 4 },
  { key: "baseColor", values: PRESET_BASE_COLORS, bits: 4 },
  { key: "theme", values: PRESET_THEMES, bits: 5 },
  { key: "chartColor", values: PRESET_CHART_COLORS, bits: 5 },
  { key: "font", values: PRESET_FONTS, bits: 5 },
  { key: "iconLibrary", values: PRESET_ICON_LIBRARIES, bits: 3 },
  { key: "radius", values: PRESET_RADII, bits: 3 },
] as const

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

function toBase62(num: number): string {
  if (num === 0) return "0"
  let result = ""
  let n = num
  while (n > 0) {
    result = BASE62[n % 62] + result
    n = Math.floor(n / 62)
  }
  return result
}

export function encodePreset(config: Partial<PresetConfig>): string {
  const merged = { ...DEFAULT_PRESET_CONFIG, ...config }
  let bits = 0
  let offset = 0
  for (const field of PRESET_FIELDS_V1) {
    const idx = (field.values as readonly string[]).indexOf(
      merged[field.key as keyof PresetConfig] as string
    )
    bits += (idx === -1 ? 0 : idx) * 2 ** offset
    offset += field.bits
  }
  return "a" + toBase62(bits)
}

function fromBase62(str: string): number {
  let result = 0
  for (let i = 0; i < str.length; i++) {
    const idx = BASE62.indexOf(str.charAt(i))
    if (idx === -1) return -1
    result = result * 62 + idx
  }
  return result
}

export function decodePreset(code: string): PresetConfig | null {
  if (!code || code.length < 2) return null
  if (code.charAt(0) !== "a") return null
  const bits = fromBase62(code.slice(1))
  if (bits < 0) return null

  const result: Record<string, string> = {}
  let offset = 0
  for (const field of PRESET_FIELDS_V1) {
    const idx = Math.floor(bits / 2 ** offset) % 2 ** field.bits
    const values = field.values as readonly string[]
    result[field.key] = idx < values.length ? values[idx]! : values[0]!
    offset += field.bits
  }
  return result as unknown as PresetConfig
}

export const DEFAULT_CONFIG = DEFAULT_PRESET_CONFIG

// Field keys that can be locked/shuffled.
export type PresetField = keyof PresetConfig

// Generate a random config, respecting locked fields.
export function randomizeConfig(
  current: PresetConfig,
  locked: Partial<Record<PresetField, boolean>> = {}
): PresetConfig {
  const pick = <T>(arr: readonly T[]): T =>
    arr[Math.floor(Math.random() * arr.length)]!

  return {
    style: locked.style ? current.style : pick(PRESET_STYLES),
    baseColor: locked.baseColor ? current.baseColor : pick(PRESET_BASE_COLORS),
    theme: locked.theme ? current.theme : pick(PRESET_THEMES),
    chartColor: locked.chartColor ? current.chartColor : pick(PRESET_CHART_COLORS),
    font: locked.font ? current.font : pick(PRESET_FONTS),
    iconLibrary: locked.iconLibrary ? current.iconLibrary : pick(PRESET_ICON_LIBRARIES),
    radius: locked.radius ? current.radius : pick(PRESET_RADII),
  }
}

// Display mappings
export const FONT_FAMILIES: Record<PresetConfig["font"], string> = {
  "inter": "Inter",
  "dm-sans": "DM Sans",
  "nunito-sans": "Nunito Sans",
  "figtree": "Figtree",
  "outfit": "Outfit",
  "manrope": "Manrope",
  "space-grotesk": "Space Grotesk",
  "montserrat": "Montserrat",
  "roboto": "Roboto",
  "raleway": "Raleway",
  "public-sans": "Public Sans",
  "source-sans-3": "Source Sans 3",
  "lora": "Lora",
  "merriweather": "Merriweather",
  "playfair-display": "Playfair Display",
  "jetbrains-mono": "JetBrains Mono",
  "space-mono": "Space Mono",
  "fira-code": "Fira Code",
  "noto-serif": "Noto Serif",
  "roboto-slab": "Roboto Slab",
  "instrument-sans": "Instrument Sans",
  "instrument-serif": "Instrument Serif",
  "geist": "Geist",
}

export const ICON_PACKAGES: Record<PresetConfig["iconLibrary"], string> = {
  "lucide": "lucide-react-native",
  "phosphor": "phosphor-react-native",
  "tabler": "@tabler/icons-react-native",
  "expo": "@expo/vector-icons",
  "heroicons": "react-native-heroicons",
}

export const RADIUS_VALUES: Record<PresetConfig["radius"], string> = {
  "default": "0.5rem",
  "none": "0rem",
  "small": "0.125rem",
  "medium": "0.625rem",
  "large": "0.75rem",
  "full": "1.5rem",
}

export const STYLE_LABELS: Record<PresetConfig["style"], string> = {
  "new-york": "New York",
  "default": "Default",
  "luma": "Luma",
  "lyra": "Lyra",
  "maia": "Maia",
  "mira": "Mira",
  "nova": "Nova",
  "rhea": "Rhea",
  "sera": "Sera",
  "vega": "Vega",
}

// Color swatches for the picker
export const COLOR_SWATCHES: Record<PresetConfig["baseColor"], string> = {
  "zinc": "#71717a",
  "slate": "#64748b",
  "stone": "#78716c",
  "gray": "#6b7280",
  "neutral": "#737373",
  "taupe": "#8b7d6b",
  "mauve": "#8b668b",
  "olive": "#6b8e6b",
  "mist": "#6b8e8e",
}

// Accent/chart color swatches (Tailwind ~600 shade hex).
export const THEME_SWATCHES: Record<PresetConfig["theme"], string> = {
  "zinc": "#52525b",
  "slate": "#475569",
  "stone": "#57534e",
  "gray": "#4b5563",
  "neutral": "#525252",
  "red": "#dc2626",
  "orange": "#ea580c",
  "amber": "#d97706",
  "yellow": "#ca8a04",
  "lime": "#65a30d",
  "green": "#16a34a",
  "emerald": "#059669",
  "teal": "#0d9488",
  "cyan": "#0891b2",
  "sky": "#0284c7",
  "blue": "#2563eb",
  "indigo": "#4f46e5",
  "violet": "#7c3aed",
  "purple": "#9333ea",
  "fuchsia": "#c026d3",
  "pink": "#db2777",
  "rose": "#e11d48",
}
