"use client"

import * as React from "react"
import { CopyIcon, CheckIcon, DicesIcon, RotateCcwIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Picker } from "./picker"
import {
  PRESET_STYLES,
  PRESET_BASE_COLORS,
  PRESET_THEMES,
  PRESET_CHART_COLORS,
  PRESET_FONTS,
  PRESET_ICON_LIBRARIES,
  PRESET_RADII,
  encodePreset,
  decodePreset,
  randomizeConfig,
  DEFAULT_CONFIG,
  FONT_FAMILIES,
  ICON_PACKAGES,
  RADIUS_VALUES,
  STYLE_LABELS,
  COLOR_SWATCHES,
  THEME_SWATCHES,
  type PresetConfig,
  type PresetField,
} from "./preset-data"

// Build picker options
const STYLE_OPTIONS = PRESET_STYLES.map((s) => ({ value: s, label: STYLE_LABELS[s] }))
const COLOR_OPTIONS = PRESET_BASE_COLORS.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
  swatch: COLOR_SWATCHES[c],
}))
const THEME_OPTIONS = PRESET_THEMES.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
  swatch: THEME_SWATCHES[c],
}))
const CHART_OPTIONS = PRESET_CHART_COLORS.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
  swatch: THEME_SWATCHES[c],
}))
const FONT_OPTIONS = PRESET_FONTS.map((f) => ({ value: f, label: FONT_FAMILIES[f] }))
const ICON_OPTIONS = PRESET_ICON_LIBRARIES.map((i) => ({
  value: i,
  label: i.charAt(0).toUpperCase() + i.slice(1),
  hint: ICON_PACKAGES[i],
}))
const RADIUS_OPTIONS = PRESET_RADII.map((r) => ({
  value: r,
  label: r.charAt(0).toUpperCase() + r.slice(1),
  hint: RADIUS_VALUES[r],
}))

export function CreateCustomizer() {
  const [config, setConfig] = React.useState<PresetConfig>(DEFAULT_CONFIG)
  const [engine, setEngine] = React.useState<"nativewind" | "uniwind">("nativewind")
  const [locks, setLocks] = React.useState<Partial<Record<PresetField, boolean>>>({})
  const [copied, setCopied] = React.useState(false)

  const presetCode = React.useMemo(() => encodePreset(config), [config])
  const command = `npx lovda init --preset ${presetCode} --engine ${engine}`

  // Read preset from URL on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const preset = params.get("preset")
    if (preset) {
      const decoded = decodePreset(preset)
      if (decoded) setConfig(decoded)
    }
    const eng = params.get("engine")
    if (eng === "nativewind" || eng === "uniwind") setEngine(eng)
  }, [])

  // Sync preset to URL
  React.useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("preset", presetCode)
    url.searchParams.set("engine", engine)
    window.history.replaceState({}, "", url.toString())
  }, [presetCode, engine])

  const update = <K extends PresetField>(key: K, value: PresetConfig[K]) => {
    setConfig((c) => ({ ...c, [key]: value }))
  }

  const toggleLock = (key: PresetField) => {
    setLocks((l) => ({ ...l, [key]: !l[key] }))
  }

  const shuffle = () => {
    setConfig((c) => randomizeConfig(c, locks))
  }

  const reset = () => {
    setConfig(DEFAULT_CONFIG)
    setLocks({})
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
    } catch {
      // ignore
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Keyboard shortcut: "r" to shuffle, "Shift+R" to reset
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (
        target?.isContentEditable ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return
      }
      if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        if (e.shiftKey) reset()
        else shuffle()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locks])

  return (
    <div className="flex min-h-0 flex-1 flex-col-reverse gap-4 md:flex-row md:gap-6">
      {/* Sidebar Card */}
      <div className="w-full shrink-0 md:w-72">
        <div className="sticky top-20 flex flex-col rounded-2xl border border-border bg-card/90 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold">Customize</span>
            <span className="font-mono text-xs text-muted-foreground">{presetCode}</span>
          </div>

          {/* Pickers */}
          <div className="flex flex-col gap-2.5 p-4">
            {/* Style Engine toggle (like shadcn's Radix/Base picker) */}
            <div>
              <span className="mb-1.5 block text-xs text-muted-foreground">Style Engine</span>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-card p-1">
                {(["nativewind", "uniwind"] as const).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEngine(e)}
                    className={
                      "rounded-md px-2 py-1.5 text-sm font-medium capitalize transition-colors " +
                      (engine === e
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent")
                    }
                  >
                    {e === "nativewind" ? "NativeWind" : "Uniwind"}
                  </button>
                ))}
              </div>
            </div>
            <Picker
              label="Style"
              value={config.style}
              options={STYLE_OPTIONS}
              onChange={(v) => update("style", v)}
              locked={locks.style}
              onToggleLock={() => toggleLock("style")}
            />
            <Picker
              label="Base Color"
              value={config.baseColor}
              options={COLOR_OPTIONS}
              onChange={(v) => update("baseColor", v)}
              locked={locks.baseColor}
              onToggleLock={() => toggleLock("baseColor")}
              renderValue={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            />
            <Picker
              label="Theme"
              value={config.theme}
              options={THEME_OPTIONS}
              onChange={(v) => update("theme", v)}
              locked={locks.theme}
              onToggleLock={() => toggleLock("theme")}
              renderValue={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            />
            <Picker
              label="Chart Color"
              value={config.chartColor}
              options={CHART_OPTIONS}
              onChange={(v) => update("chartColor", v)}
              locked={locks.chartColor}
              onToggleLock={() => toggleLock("chartColor")}
              renderValue={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            />
            <Picker
              label="Font"
              value={config.font}
              options={FONT_OPTIONS}
              onChange={(v) => update("font", v)}
              locked={locks.font}
              onToggleLock={() => toggleLock("font")}
              renderValue={(v) => FONT_FAMILIES[v]}
            />
            <Picker
              label="Icon Library"
              value={config.iconLibrary}
              options={ICON_OPTIONS}
              onChange={(v) => update("iconLibrary", v)}
              locked={locks.iconLibrary}
              onToggleLock={() => toggleLock("iconLibrary")}
              renderValue={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            />
            <Picker
              label="Radius"
              value={config.radius}
              options={RADIUS_OPTIONS}
              onChange={(v) => update("radius", v)}
              locked={locks.radius}
              onToggleLock={() => toggleLock("radius")}
              renderValue={(v) => `${v.charAt(0).toUpperCase() + v.slice(1)} (${RADIUS_VALUES[v]})`}
            />
          </div>

          {/* Footer actions */}
          <div className="flex flex-col gap-2 border-t border-border p-4">
            <button
              onClick={copy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
              {copied ? "Copied!" : "Copy Command"}
            </button>
            <div className="flex gap-2">
              <button
                onClick={shuffle}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                title="Shuffle (press R)"
              >
                <DicesIcon className="size-4" />
                Shuffle
              </button>
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                title="Reset (Shift+R)"
                aria-label="Reset"
              >
                <RotateCcwIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview area */}
      <div className="min-h-0 flex-1">
        <div className="flex h-full min-h-[500px] flex-col rounded-2xl border border-dashed border-border bg-muted/20">
          {/* Command bar */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="select-none text-muted-foreground">$</span>
            <code className="flex-1 select-all font-mono text-sm">{command}</code>
            <button
              onClick={copy}
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Preview placeholder — add preview components here later */}
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-border bg-card">
                <span className="text-2xl">📱</span>
              </div>
              <p className="text-sm font-medium">Preview coming soon</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Live component preview for{" "}
                <strong>{STYLE_LABELS[config.style]}</strong> with{" "}
                <strong>{FONT_FAMILIES[config.font]}</strong>,{" "}
                <strong className="capitalize">{config.iconLibrary}</strong> icons, and{" "}
                <strong className="capitalize">{config.baseColor}</strong> base color.
              </p>
            </div>
          </div>

          {/* Config summary footer */}
          <div className="border-t border-border px-4 py-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
              <span>style: <strong className="text-foreground">{config.style}</strong></span>
              <span>base: <strong className="text-foreground">{config.baseColor}</strong></span>
              <span>theme: <strong className="text-foreground">{config.theme}</strong></span>
              <span>chart: <strong className="text-foreground">{config.chartColor}</strong></span>
              <span>font: <strong className="text-foreground">{config.font}</strong></span>
              <span>icons: <strong className="text-foreground">{config.iconLibrary}</strong></span>
              <span>radius: <strong className="text-foreground">{config.radius}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
