"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  CopyIcon,
  CheckIcon,
  DicesIcon,
  RotateCcwIcon,
  XIcon,
  MonitorIcon,
  SmartphoneIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { getExpoPreviewUrl } from "@/lib/preview"
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

type PackageManager = "npm" | "pnpm" | "yarn" | "bun"

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
  const [selectedEngine, setSelectedEngine] = React.useState<"nativewind" | "uniwind">("nativewind")
  const [packageManager, setPackageManager] = React.useState<PackageManager>("npm")
  const [locks, setLocks] = React.useState<Partial<Record<PresetField, boolean>>>({})
  const [copied, setCopied] = React.useState(false)
  const [openDialog, setOpenDialog] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"web" | "native">("web")

  const presetCode = React.useMemo(() => encodePreset(config), [config])
  const webPreviewUrl = React.useMemo(
    () =>
      getExpoPreviewUrl({
        component: "dashboard",
        chrome: "web",
        preset: presetCode,
        engine: selectedEngine,
      }),
    [presetCode, selectedEngine]
  )

  const command = React.useMemo(() => {
    const prefix = {
      npm: "npx lovda@latest init",
      pnpm: "pnpm dlx lovda@latest init",
      yarn: "yarn dlx lovda@latest init",
      bun: "bunx --bun lovda@latest init",
    }[packageManager]
    return `${prefix} --preset ${presetCode} --engine ${selectedEngine}`
  }, [packageManager, selectedEngine, presetCode])

  // Read preset from URL on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const preset = params.get("preset")
    if (preset) {
      const decoded = decodePreset(preset)
      if (decoded) setConfig(decoded)
    }
    const eng = params.get("engine")
    if (eng === "nativewind" || eng === "uniwind") setSelectedEngine(eng)
  }, [])

  // Sync preset to URL
  React.useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("preset", presetCode)
    url.searchParams.set("engine", selectedEngine)
    window.history.replaceState({}, "", url.toString())
  }, [presetCode, selectedEngine])

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
    <div className="flex flex-1 flex-col w-full overflow-hidden bg-background md:h-[calc(100dvh-var(--header-height))] md:flex-none md:flex-row">
      {/* Left Sidebar Panel - Flush to the left edge of the page */}
      <aside className="relative z-20 w-full md:w-72 h-full border-r border-border bg-card/60 backdrop-blur-xl flex flex-col shrink-0 min-h-0 overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <span className="text-sm font-semibold tracking-tight">Customize</span>
          <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {presetCode}
          </span>
        </div>

        {/* Pickers list */}
        <div className="flex-1 flex flex-col gap-2.5 px-3 py-3 overflow-visible">
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
        <div className="border-t border-border p-3 bg-muted/20 shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setOpenDialog(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-105 active:scale-[0.99]"
          >
            Get Code
          </button>
          <div className="flex gap-2">
            <button
              onClick={shuffle}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent active:scale-[0.99]"
              title="Shuffle (press R)"
            >
              <DicesIcon className="size-4" />
              Shuffle
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent active:scale-[0.99]"
              title="Reset (Shift+R)"
              aria-label="Reset"
            >
              <RotateCcwIcon className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Right Preview area */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-muted/5 relative">
        {/* Toggle between Expo Web and Mobile */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-card/40 backdrop-blur-sm shrink-0">
          <div className="flex gap-1 rounded-lg border border-border bg-card p-0.5 shadow-sm">
            {([
              { mode: "web", icon: MonitorIcon, label: "Expo Web" },
              { mode: "native", icon: SmartphoneIcon, label: "Mobile" },
            ] as const).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all",
                  viewMode === mode
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
            {viewMode === "web" ? "Expo Web Preview" : "Mobile Preview"}
          </span>
        </div>

        {/* Preview on a dotted grid backdrop */}
        <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col p-4 md:p-6 bg-[radial-gradient(hsl(var(--border)/0.6)_1px,transparent_1px)] [background-size:18px_18px]">
          {/* subtle glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.06),transparent)]" />

          {viewMode === "web" ? (
            /* Desktop preview - iframe pinned to fill the card (overrides UA 150px height) */
            <div className="relative z-10 flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-background shadow-lg animate-in fade-in duration-300">
              <iframe
                src={webPreviewUrl}
                className="absolute inset-0 h-full w-full border-0 select-none bg-background"
                title="Expo Web Preview"
              />
            </div>
          ) : (
            /* Mobile preview is not available yet. */
            <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center">
              <div className="flex max-w-sm flex-col items-center gap-3 px-6 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="flex size-14 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                  <SmartphoneIcon className="size-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-foreground">Mobile preview coming soon</h2>
                  <p className="text-sm text-muted-foreground">Use the Expo Web preview while we finish the native experience.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Get Code Dialog/Modal */}
      {openDialog && typeof document !== "undefined"
        ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          {/* Background dismiss */}
          <div className="absolute inset-0" onClick={() => setOpenDialog(false)} />
          
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="get-code-title"
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-5 text-card-foreground"
          >
            {/* Close button */}
            <button
              onClick={() => setOpenDialog(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              aria-label="Close dialog"
            >
              <XIcon className="size-4" />
            </button>

            {/* Header */}
            <div>
              <h2 id="get-code-title" className="text-lg font-semibold tracking-tight">Get Code</h2>
              <p className="text-sm text-muted-foreground">
                Configure your project's engine and package manager to initialize the design system.
              </p>
            </div>

            {/* Selection Options */}
            <div className="flex flex-col gap-4">
              {/* Style Engine options */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engine</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["nativewind", "uniwind"] as const).map((eng) => {
                    const isSelected = selectedEngine === eng
                    return (
                      <button
                        key={eng}
                        type="button"
                        onClick={() => setSelectedEngine(eng)}
                        className={cn(
                          "flex flex-col items-start p-3 rounded-lg border text-left transition-all hover:bg-muted/30",
                          isSelected
                            ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                            : "border-border bg-transparent text-muted-foreground"
                        )}
                      >
                        <span className="text-sm font-semibold capitalize text-foreground">{eng === "nativewind" ? "NativeWind" : "Uniwind"}</span>
                        <span className="text-xs text-muted-foreground mt-0.5 leading-4">
                          {eng === "nativewind" ? "Standard React Native Tailwind utility-based theme styling." : "Dynamic, high-performance runtime style processor engine."}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Package Manager selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Package Manager</label>
                <div className="grid grid-cols-4 gap-1.5 rounded-lg border border-border p-1 bg-muted/10">
                  {(["npm", "pnpm", "yarn", "bun"] as const).map((pkg) => {
                    const isSelected = packageManager === pkg
                    return (
                      <button
                        key={pkg}
                        type="button"
                        onClick={() => setPackageManager(pkg)}
                        className={cn(
                          "rounded-md py-1.5 text-xs font-semibold transition-all capitalize",
                          isSelected
                            ? "bg-card text-foreground shadow-sm border border-border"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {pkg}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Command execution block */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Initialization Command</label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs text-foreground relative group overflow-hidden">
                <code className="flex-1 select-all break-all pr-8 leading-5">{command}</code>
                <button
                  onClick={copy}
                  className="absolute right-2.5 top-2.5 p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all opacity-80 hover:opacity-100 shadow-sm"
                  title="Copy command"
                >
                  {copied ? <CheckIcon className="size-3.5 text-green-600" /> : <CopyIcon className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Main Copy Button */}
            <button
              onClick={copy}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity mt-2 shadow-sm"
            >
              {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
              {copied ? "Copied!" : "Copy Command"}
            </button>
          </div>
        </div>,
        document.body
      )
        : null}
    </div>
  )
}
