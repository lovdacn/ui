// Preset encoding/decoding utilities for lvcn.
// Bit-packs design system params into a single integer,
// then encodes as base62 with a version prefix character.
// Browser-safe: no Node.js dependencies.
//
// Rules for backward compat:
//   1. Never reorder existing value arrays — only append.
//   2. New fields must have their default at index 0.
//   3. Only append new fields to the end of PRESET_FIELDS.
//   4. Stay under 53 bits total (JS safe integer limit).

// Value arrays — order matters for backward compat. Never reorder, only append.

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

// Accent/primary colors + chart colors. Grayscale families keep the base
// color's primary; accents override it. Order matters — append only.
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

// Field definitions for v1 (version "a"): 29 bits.
const PRESET_FIELDS_V1 = [
  { key: "style", values: PRESET_STYLES, bits: 4 },
  { key: "baseColor", values: PRESET_BASE_COLORS, bits: 4 },
  { key: "theme", values: PRESET_THEMES, bits: 5 },
  { key: "chartColor", values: PRESET_CHART_COLORS, bits: 5 },
  { key: "font", values: PRESET_FONTS, bits: 5 },
  { key: "iconLibrary", values: PRESET_ICON_LIBRARIES, bits: 3 },
  { key: "radius", values: PRESET_RADII, bits: 3 },
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

export const DEFAULT_PRESET_CONFIG: PresetConfig = {
  style: "new-york",
  baseColor: "zinc",
  theme: "zinc",
  chartColor: "blue",
  font: "inter",
  iconLibrary: "lucide",
  radius: "default",
}

// Base62 alphabet.
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

// Version prefixes — "a" = v1.
const CURRENT_VERSION = "a"
const VALID_VERSIONS = ["a"] as const

export function toBase62(num: number): string {
  if (num === 0) return "0"
  let result = ""
  let n = num
  while (n > 0) {
    result = BASE62.charAt(n % 62) + result
    n = Math.floor(n / 62)
  }
  return result
}

export function fromBase62(str: string): number {
  let result = 0
  for (let i = 0; i < str.length; i++) {
    const idx = BASE62.indexOf(str.charAt(i))
    if (idx === -1) return -1
    result = result * 62 + idx
  }
  return result
}

// Encode a PresetConfig into a short alphanumeric code.
export function encodePreset(config: Partial<PresetConfig>): string {
  const merged = { ...DEFAULT_PRESET_CONFIG, ...config }

  // Uses multiplication instead of bitwise ops (JS bitwise truncates to 32 bits).
  let bits = 0
  let offset = 0
  for (const field of PRESET_FIELDS_V1) {
    const idx = (field.values as readonly string[]).indexOf(
      merged[field.key as keyof PresetConfig] as string
    )
    bits += (idx === -1 ? 0 : idx) * 2 ** offset
    offset += field.bits
  }

  return CURRENT_VERSION + toBase62(bits)
}

// Decode a preset code back into a PresetConfig.
export function decodePreset(code: string): PresetConfig | null {
  if (!code || code.length < 2) {
    return null
  }

  const version = code.charAt(0)
  if (!VALID_VERSIONS.includes(version as (typeof VALID_VERSIONS)[number])) {
    return null
  }

  const fields = PRESET_FIELDS_V1

  const bits = fromBase62(code.slice(1))
  if (bits < 0) return null

  const result: Record<string, string> = {}
  let offset = 0
  for (const field of fields) {
    const idx = Math.floor(bits / 2 ** offset) % 2 ** field.bits
    const values = field.values as readonly string[]
    result[field.key] = idx < values.length ? values[idx]! : values[0]!
    offset += field.bits
  }

  return result as unknown as PresetConfig
}

// Check if a string looks like a preset code (version char + base62).
export function isPresetCode(value: string): boolean {
  if (!value || value.length < 2 || value.length > 8) {
    return false
  }

  if (!VALID_VERSIONS.includes(value.charAt(0) as (typeof VALID_VERSIONS)[number])) {
    return false
  }

  for (let i = 1; i < value.length; i++) {
    if (BASE62.indexOf(value.charAt(i)) === -1) {
      return false
    }
  }

  return true
}

// Validate that a preset code decodes successfully.
export function isValidPreset(code: string): boolean {
  return decodePreset(code) !== null
}

// Generate a random PresetConfig.
export function generateRandomConfig(): PresetConfig {
  const pick = <T>(arr: readonly T[]): T =>
    arr[Math.floor(Math.random() * arr.length)]!

  return {
    style: pick(PRESET_STYLES),
    baseColor: pick(PRESET_BASE_COLORS),
    theme: pick(PRESET_THEMES),
    chartColor: pick(PRESET_CHART_COLORS),
    font: pick(PRESET_FONTS),
    iconLibrary: pick(PRESET_ICON_LIBRARIES),
    radius: pick(PRESET_RADII),
  }
}

// Generate a random preset code.
export function generateRandomPreset(): string {
  return encodePreset(generateRandomConfig())
}

// Map font names to their expo-google-fonts package names.
export const FONT_PACKAGES: Record<PresetConfig["font"], string> = {
  "inter": "@expo-google-fonts/inter",
  "dm-sans": "@expo-google-fonts/dm-sans",
  "nunito-sans": "@expo-google-fonts/nunito-sans",
  "figtree": "@expo-google-fonts/figtree",
  "outfit": "@expo-google-fonts/outfit",
  "manrope": "@expo-google-fonts/manrope",
  "space-grotesk": "@expo-google-fonts/space-grotesk",
  "montserrat": "@expo-google-fonts/montserrat",
  "roboto": "@expo-google-fonts/roboto",
  "raleway": "@expo-google-fonts/raleway",
  "public-sans": "@expo-google-fonts/public-sans",
  "source-sans-3": "@expo-google-fonts/source-sans-3",
  "lora": "@expo-google-fonts/lora",
  "merriweather": "@expo-google-fonts/merriweather",
  "playfair-display": "@expo-google-fonts/playfair-display",
  "jetbrains-mono": "@expo-google-fonts/jetbrains-mono",
  "space-mono": "@expo-google-fonts/space-mono",
  "fira-code": "@expo-google-fonts/fira-code",
  "noto-serif": "@expo-google-fonts/noto-serif",
  "roboto-slab": "@expo-google-fonts/roboto-slab",
  "instrument-sans": "@expo-google-fonts/instrument-sans",
  "instrument-serif": "@expo-google-fonts/instrument-serif",
  "geist": "@expo-google-fonts/geist",
}

// Map font names to their CSS font-family values.
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

// Map icon library names to their npm packages.
export const ICON_PACKAGES: Record<PresetConfig["iconLibrary"], string> = {
  "lucide": "lucide-react-native",
  "phosphor": "phosphor-react-native",
  "tabler": "@tabler/icons-react-native",
  "expo": "@expo/vector-icons",
  "heroicons": "react-native-heroicons",
}

// Map icon library names to their import source.
export const ICON_IMPORTS: Record<PresetConfig["iconLibrary"], string> = {
  "lucide": "lucide-react-native",
  "phosphor": "phosphor-react-native",
  "tabler": "@tabler/icons-react-native",
  "expo": "@expo/vector-icons",
  "heroicons": "react-native-heroicons/outline",
}

// Map radius names to CSS values.
export const RADIUS_VALUES: Record<PresetConfig["radius"], string> = {
  "default": "0.5rem",
  "none": "0rem",
  "small": "0.125rem",
  "medium": "0.625rem",
  "large": "0.75rem",
  "full": "9999px",
}

// Font category helpers.
export const SERIF_FONTS = new Set<PresetConfig["font"]>([
  "lora",
  "merriweather",
  "playfair-display",
  "noto-serif",
  "roboto-slab",
  "instrument-serif",
])

export const MONO_FONTS = new Set<PresetConfig["font"]>([
  "jetbrains-mono",
  "space-mono",
  "fira-code",
])

export function getFontCategory(font: PresetConfig["font"]): "sans" | "serif" | "mono" {
  if (SERIF_FONTS.has(font)) return "serif"
  if (MONO_FONTS.has(font)) return "mono"
  return "sans"
}
