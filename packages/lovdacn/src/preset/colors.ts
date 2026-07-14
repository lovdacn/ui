// Accent theme + chart color palettes (Tailwind v4 OKLCH values).
// - THEME colors override --primary / --primary-foreground.
// - CHART colors fill --chart-1 .. --chart-5.
//
// Grayscale families (zinc, slate, stone, gray, neutral) keep the base
// color's primary, so they are marked `grayscale: true` and skip the
// primary override.

export type ColorRamp = {
  // OKLCH shades 300, 400, 500, 600, 700
  "300": string
  "400": string
  "500": string
  "600": string
  "700": string
  // Whether this family is a neutral/grayscale (no primary override)
  grayscale?: boolean
  // Foreground color to pair with the primary (light colors need dark text)
  darkForeground?: boolean
}

export const COLOR_RAMPS: Record<string, ColorRamp> = {
  // ── Grayscale (theme = keep base primary) ──
  zinc: { "300": "oklch(0.871 0.006 286.286)", "400": "oklch(0.705 0.015 286.067)", "500": "oklch(0.552 0.016 285.938)", "600": "oklch(0.442 0.017 285.786)", "700": "oklch(0.37 0.013 285.805)", grayscale: true },
  slate: { "300": "oklch(0.869 0.022 252.894)", "400": "oklch(0.704 0.04 256.788)", "500": "oklch(0.554 0.046 257.417)", "600": "oklch(0.446 0.043 257.281)", "700": "oklch(0.372 0.044 257.287)", grayscale: true },
  stone: { "300": "oklch(0.869 0.005 56.366)", "400": "oklch(0.709 0.01 56.259)", "500": "oklch(0.553 0.013 58.071)", "600": "oklch(0.444 0.011 73.639)", "700": "oklch(0.374 0.01 67.558)", grayscale: true },
  gray: { "300": "oklch(0.872 0.01 258.338)", "400": "oklch(0.707 0.022 261.325)", "500": "oklch(0.551 0.027 264.364)", "600": "oklch(0.446 0.03 256.802)", "700": "oklch(0.373 0.034 259.733)", grayscale: true },
  neutral: { "300": "oklch(0.87 0 0)", "400": "oklch(0.708 0 0)", "500": "oklch(0.556 0 0)", "600": "oklch(0.439 0 0)", "700": "oklch(0.371 0 0)", grayscale: true },

  // ── Accents ──
  red: { "300": "oklch(0.808 0.114 19.571)", "400": "oklch(0.704 0.191 22.216)", "500": "oklch(0.637 0.237 25.331)", "600": "oklch(0.577 0.245 27.325)", "700": "oklch(0.505 0.213 27.518)" },
  orange: { "300": "oklch(0.837 0.128 66.29)", "400": "oklch(0.75 0.183 55.934)", "500": "oklch(0.705 0.213 47.604)", "600": "oklch(0.646 0.222 41.116)", "700": "oklch(0.553 0.195 38.402)" },
  amber: { "300": "oklch(0.879 0.169 91.605)", "400": "oklch(0.828 0.189 84.429)", "500": "oklch(0.769 0.188 70.08)", "600": "oklch(0.666 0.179 58.318)", "700": "oklch(0.555 0.163 48.998)", darkForeground: true },
  yellow: { "300": "oklch(0.905 0.182 98.111)", "400": "oklch(0.852 0.199 91.936)", "500": "oklch(0.795 0.184 86.047)", "600": "oklch(0.681 0.162 75.834)", "700": "oklch(0.554 0.135 66.442)", darkForeground: true },
  lime: { "300": "oklch(0.897 0.196 126.665)", "400": "oklch(0.841 0.238 128.85)", "500": "oklch(0.768 0.233 130.85)", "600": "oklch(0.648 0.2 131.684)", "700": "oklch(0.532 0.157 131.589)", darkForeground: true },
  green: { "300": "oklch(0.871 0.15 154.449)", "400": "oklch(0.792 0.209 151.711)", "500": "oklch(0.723 0.219 149.579)", "600": "oklch(0.627 0.194 149.214)", "700": "oklch(0.527 0.154 150.069)" },
  emerald: { "300": "oklch(0.845 0.143 164.978)", "400": "oklch(0.765 0.177 163.223)", "500": "oklch(0.696 0.17 162.48)", "600": "oklch(0.596 0.145 163.225)", "700": "oklch(0.508 0.118 165.612)" },
  teal: { "300": "oklch(0.855 0.138 181.071)", "400": "oklch(0.777 0.152 181.912)", "500": "oklch(0.704 0.14 182.503)", "600": "oklch(0.6 0.118 184.704)", "700": "oklch(0.511 0.096 186.391)" },
  cyan: { "300": "oklch(0.865 0.127 207.078)", "400": "oklch(0.789 0.154 211.53)", "500": "oklch(0.715 0.143 215.221)", "600": "oklch(0.609 0.126 221.723)", "700": "oklch(0.52 0.105 223.128)" },
  sky: { "300": "oklch(0.828 0.111 230.318)", "400": "oklch(0.746 0.16 232.661)", "500": "oklch(0.685 0.169 237.323)", "600": "oklch(0.588 0.158 241.966)", "700": "oklch(0.5 0.134 242.749)" },
  blue: { "300": "oklch(0.809 0.105 251.813)", "400": "oklch(0.707 0.165 254.624)", "500": "oklch(0.623 0.214 259.815)", "600": "oklch(0.546 0.245 262.881)", "700": "oklch(0.488 0.243 264.376)" },
  indigo: { "300": "oklch(0.785 0.115 274.713)", "400": "oklch(0.673 0.182 276.935)", "500": "oklch(0.585 0.233 277.117)", "600": "oklch(0.511 0.262 276.966)", "700": "oklch(0.457 0.24 277.023)" },
  violet: { "300": "oklch(0.811 0.111 293.571)", "400": "oklch(0.702 0.183 293.541)", "500": "oklch(0.606 0.25 292.717)", "600": "oklch(0.541 0.281 293.009)", "700": "oklch(0.491 0.27 292.581)" },
  purple: { "300": "oklch(0.827 0.119 306.383)", "400": "oklch(0.714 0.203 305.504)", "500": "oklch(0.627 0.265 303.9)", "600": "oklch(0.558 0.288 302.321)", "700": "oklch(0.496 0.265 301.924)" },
  fuchsia: { "300": "oklch(0.833 0.145 321.434)", "400": "oklch(0.74 0.238 322.16)", "500": "oklch(0.667 0.295 322.15)", "600": "oklch(0.591 0.293 322.896)", "700": "oklch(0.518 0.253 323.949)" },
  pink: { "300": "oklch(0.823 0.12 346.018)", "400": "oklch(0.718 0.202 349.761)", "500": "oklch(0.656 0.241 354.308)", "600": "oklch(0.592 0.249 0.584)", "700": "oklch(0.525 0.223 3.958)" },
  rose: { "300": "oklch(0.81 0.117 11.638)", "400": "oklch(0.712 0.194 13.428)", "500": "oklch(0.645 0.246 16.439)", "600": "oklch(0.586 0.253 17.585)", "700": "oklch(0.514 0.222 16.935)" },
}

// White / near-white foreground for accent primaries.
const LIGHT_FG = "oklch(0.985 0 0)"
const DARK_FG = "oklch(0.205 0 0)"

// ── OKLCH → HSL conversion (for NativeWind which stores HSL triplets) ──
// oklch(L C H) → "H S% L%" string. Single source of truth stays OKLCH.

function oklchToHslTriplet(oklch: string): string {
  const match = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/)
  if (!match) return "0 0% 0%"
  const L = parseFloat(match[1]!)
  const C = parseFloat(match[2]!)
  const H = parseFloat(match[3]!)

  // OKLCH → OKLab
  const hRad = (H * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)

  // OKLab → linear sRGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  // linear → gamma sRGB
  const gamma = (c: number) =>
    c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  r = Math.min(1, Math.max(0, gamma(r)))
  g = Math.min(1, Math.max(0, gamma(g)))
  bl = Math.min(1, Math.max(0, gamma(bl)))

  // sRGB → HSL
  const max = Math.max(r, g, bl)
  const min = Math.min(r, g, bl)
  const lum = (max + min) / 2
  let h = 0
  let sat = 0
  const d = max - min
  if (d !== 0) {
    sat = d / (1 - Math.abs(2 * lum - 1))
    switch (max) {
      case r:
        h = ((g - bl) / d) % 6
        break
      case g:
        h = (bl - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }

  return `${h.toFixed(1)} ${(sat * 100).toFixed(1)}% ${(lum * 100).toFixed(1)}%`
}

// Build the --primary override for a theme (accent) color.
// Returns null for grayscale families (use base color's primary).
// `format` selects oklch (uniwind) or hsl triplet (nativewind).
export function getThemePrimary(
  theme: string,
  format: "oklch" | "hsl" = "oklch"
): {
  light: { primary: string; foreground: string }
  dark: { primary: string; foreground: string }
} | null {
  const ramp = COLOR_RAMPS[theme]
  if (!ramp || ramp.grayscale) return null

  const conv = (v: string) => (format === "hsl" ? oklchToHslTriplet(v) : v)
  const fg = ramp.darkForeground ? DARK_FG : LIGHT_FG
  return {
    light: { primary: conv(ramp["600"]), foreground: conv(fg) },
    dark: { primary: conv(ramp["500"]), foreground: conv(DARK_FG) },
  }
}

// Build the --chart-1 .. --chart-5 ramp for a chart color.
// `format` selects oklch (uniwind) or hsl triplet (nativewind).
export function getChartRamp(
  chartColor: string,
  format: "oklch" | "hsl" = "oklch"
): {
  light: string[]
  dark: string[]
} {
  const ramp = COLOR_RAMPS[chartColor] ?? COLOR_RAMPS.blue!
  const conv = (v: string) => (format === "hsl" ? oklchToHslTriplet(v) : v)
  // Light mode: darker-to-mid stops read well on light surfaces.
  const light = [ramp["500"], ramp["400"], ramp["600"], ramp["300"], ramp["700"]].map(conv)
  // Dark mode: lighter stops read well on dark surfaces.
  const dark = [ramp["400"], ramp["300"], ramp["500"], ramp["300"], ramp["600"]].map(conv)
  return { light, dark }
}
