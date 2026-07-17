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
  TerminalIcon,
  SparklesIcon,
  FolderIcon,
  Droplet,
  Sun,
  PieChart,
  Shield,
  Square,
} from "lucide-react"

const StyleIcon = (
  <div className="flex size-8 items-center justify-center rounded-lg border border-pink-500/30 bg-pink-500/10 text-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.12)]">
    <SparklesIcon className="size-[16px]" />
  </div>
)

const ColorIcon = (
  <div className="flex size-8 items-center justify-center rounded-lg border border-lime-500/30 bg-lime-500/10 text-lime-600 dark:text-lime-500 shadow-[0_0_12px_rgba(132,204,22,0.12)]">
    <Droplet className="size-[16px]" />
  </div>
)

const ThemeIcon = (
  <div className="flex size-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.12)]">
    <Sun className="size-[16px]" />
  </div>
)

const ChartIcon = (
  <div className="flex size-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.12)]">
    <PieChart className="size-[16px]" />
  </div>
)

const FontIcon = (
  <div className="flex size-8 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.12)] font-semibold text-[11px] leading-none">
    Aa
  </div>
)

const IconLibIcon = (
  <div className="flex size-8 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.12)]">
    <Shield className="size-[16px]" />
  </div>
)

const RadiusIcon = (
  <div className="flex size-8 items-center justify-center rounded-lg border border-zinc-500/30 bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 shadow-[0_0_12px_rgba(113,113,122,0.08)]">
    <Square className="size-[16px]" />
  </div>
)

import { useTheme } from "next-themes"
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
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const [config, setConfig] = React.useState<PresetConfig>(DEFAULT_CONFIG)
  const [selectedEngine, setSelectedEngine] = React.useState<"nativewind" | "uniwind">("nativewind")
  const [packageManager, setPackageManager] = React.useState<PackageManager>("npm")
  const [locks, setLocks] = React.useState<Partial<Record<PresetField, boolean>>>({})
  const [copied, setCopied] = React.useState(false)
  const [openDialog, setOpenDialog] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"web" | "native">("web")
  const [target, setTarget] = React.useState<"new" | "existing">("new")

  const presetCode = React.useMemo(() => encodePreset(config), [config])
  const webPreviewUrl = React.useMemo(
    () =>
      getExpoPreviewUrl({
        component: "dashboard",
        chrome: "web",
        preset: presetCode,
        engine: selectedEngine,
        colorScheme: mounted ? (resolvedTheme || "light") : "light",
      }),
    [presetCode, selectedEngine, resolvedTheme, mounted]
  )

  const command = React.useMemo(() => {
    const runner = {
      npm: "npx lovdacn@latest",
      pnpm: "pnpm dlx lovdacn@latest",
      yarn: "yarn dlx lovdacn@latest",
      bun: "bunx --bun lovdacn@latest",
    }[packageManager]
    return target === "new"
      ? `${runner} init --preset ${presetCode} --engine ${selectedEngine}`
      : `${runner} apply ${presetCode}`
  }, [packageManager, selectedEngine, presetCode, target])

  // Read preset from URL on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const preset = params.get("preset")
    if (preset) {
      const decoded = decodePreset(preset)
      if (decoded) setConfig(decoded)
    }
  }, [])

  // Sync preset to URL
  React.useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("preset", presetCode)
    url.searchParams.delete("engine")
    window.history.replaceState({}, "", url.toString())
  }, [presetCode])

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
      <aside className="relative z-20 w-full md:w-80 h-full border-r border-border bg-card/60 backdrop-blur-xl flex flex-col shrink-0 min-h-0 overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 pt-4.5 pb-2 shrink-0 bg-transparent">
          <span className="text-sm font-bold tracking-tight text-foreground">Customize</span>
          <span className="rounded-full border border-zinc-300/80 dark:border-border bg-zinc-200/60 dark:bg-zinc-800/80 px-2 py-0.5 font-mono text-[9px] text-zinc-600 dark:text-zinc-400">
            {presetCode}
          </span>
        </div>

        {/* Pickers list */}
        <div className="flex-1 flex flex-col gap-1.5 px-3 py-2.5 overflow-visible">
          <Picker
            label="Style"
            value={config.style}
            options={STYLE_OPTIONS}
            onChange={(v) => update("style", v)}
            locked={locks.style}
            onToggleLock={() => toggleLock("style")}
            icon={StyleIcon}
          />
          <Picker
            label="Base Color"
            value={config.baseColor}
            options={COLOR_OPTIONS}
            onChange={(v) => update("baseColor", v)}
            locked={locks.baseColor}
            onToggleLock={() => toggleLock("baseColor")}
            renderValue={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            icon={ColorIcon}
          />
          <Picker
            label="Theme"
            value={config.theme}
            options={THEME_OPTIONS}
            onChange={(v) => update("theme", v)}
            locked={locks.theme}
            onToggleLock={() => toggleLock("theme")}
            renderValue={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            icon={ThemeIcon}
          />
          <Picker
            label="Chart Color"
            value={config.chartColor}
            options={CHART_OPTIONS}
            onChange={(v) => update("chartColor", v)}
            locked={locks.chartColor}
            onToggleLock={() => toggleLock("chartColor")}
            renderValue={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            icon={ChartIcon}
          />
          <Picker
            label="Font"
            value={config.font}
            options={FONT_OPTIONS}
            onChange={(v) => update("font", v)}
            locked={locks.font}
            onToggleLock={() => toggleLock("font")}
            renderValue={(v) => FONT_FAMILIES[v]}
            icon={FontIcon}
          />
          <Picker
            label="Icon Library"
            value={config.iconLibrary}
            options={ICON_OPTIONS}
            onChange={(v) => update("iconLibrary", v)}
            locked={locks.iconLibrary}
            onToggleLock={() => toggleLock("iconLibrary")}
            renderValue={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            icon={IconLibIcon}
          />
          <Picker
            label="Radius"
            value={config.radius}
            options={RADIUS_OPTIONS}
            onChange={(v) => update("radius", v)}
            locked={locks.radius}
            onToggleLock={() => toggleLock("radius")}
            renderValue={(v) => `${v.charAt(0).toUpperCase() + v.slice(1)} (${RADIUS_VALUES[v]})`}
            icon={RadiusIcon}
          />
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-transparent shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setOpenDialog(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ec4899] to-[#f97316] hover:opacity-90 text-white px-3 py-2.5 text-sm font-bold shadow-md transition-all active:scale-[0.99]"
          >
            {"</> Get Code"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedEngine((e) => (e === "nativewind" ? "uniwind" : "nativewind"))}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-zinc-100/70 hover:bg-zinc-200/70 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 px-2.5 py-1.5 text-sm font-medium transition-all active:scale-[0.99] shrink-0"
              title={`Engine: ${selectedEngine === "nativewind" ? "NativeWind" : "Uniwind"} (Click to toggle)`}
            >
              <span className="flex size-5.5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold text-foreground border border-zinc-300 dark:border-border/80">
                {selectedEngine === "nativewind" ? "N" : "U"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="m21 16-4 4-4-4" />
                <path d="M17 20V4" />
                <path d="m3 8 4-4 4 4" />
                <path d="M7 4v16" />
              </svg>
            </button>
            <button
              onClick={shuffle}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-zinc-100/70 hover:bg-zinc-200/70 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 px-3 py-1.5 text-sm font-medium transition-all active:scale-[0.99]"
              title="Shuffle (press R)"
            >
              <DicesIcon className="size-4" />
              Shuffle
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center rounded-xl border border-border bg-zinc-100/70 hover:bg-zinc-200/70 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 px-3 py-1.5 text-sm font-medium transition-all active:scale-[0.99] shrink-0"
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
            <div className="relative z-10 flex-1 min-h-0 overflow-hidden rounded-2xl p-[1px] bg-gradient-to-tr from-[#ec4899] via-[#8b5cf6] to-[#f97316] shadow-xl animate-in fade-in duration-300">
              <div className="relative h-full w-full overflow-hidden rounded-[15px] bg-background">
                <iframe
                  src={webPreviewUrl}
                  className="absolute inset-0 h-full w-full border-0 select-none bg-background animate-in fade-in duration-300"
                  title="Expo Web Preview"
                />
              </div>
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
              className="relative w-full max-w-[540px] rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-card-foreground"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/40">
                    <TerminalIcon className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 id="get-code-title" className="text-base font-semibold text-foreground">
                      Get your code
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Preset <span className="font-semibold text-foreground">{presetCode}</span> · run this in your terminal.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenDialog(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close dialog"
                >
                  <XIcon className="size-5" />
                </button>
              </div>

              {/* Target: new vs existing project */}
              <div className="grid grid-cols-2 gap-3 py-4">
                {([
                  { key: "new", icon: SparklesIcon, title: "New project", desc: "Scaffold from scratch" },
                  { key: "existing", icon: FolderIcon, title: "Existing project", desc: "Apply to your app" },
                ] as const).map(({ key, icon: Icon, title, desc }) => {
                  const isSelected = target === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTarget(key)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-transparent hover:bg-muted/30"
                      )}
                    >
                      <Icon className={cn("size-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <div>
                        <span className="block text-sm font-medium text-foreground">{title}</span>
                        <span className="text-xs text-muted-foreground">{desc}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Engine — only relevant when scaffolding a new project */}
              {target === "new" && (
                <div className="py-3">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Engine
                  </span>
                  <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1">
                    {(["nativewind", "uniwind"] as const).map((eng) => {
                      const isSelected = selectedEngine === eng
                      return (
                        <button
                          key={eng}
                          type="button"
                          onClick={() => setSelectedEngine(eng)}
                          className={cn(
                            "rounded-lg py-1.5 text-xs font-medium transition-colors",
                            isSelected
                              ? "border border-border bg-muted text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {eng === "nativewind" ? "NativeWind" : "Uniwind"}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Package Manager */}
              <div className="py-3">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Package Manager
                </span>
                <div className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-background p-1">
                  {(["npm", "pnpm", "yarn", "bun"] as const).map((pkg) => {
                    const isSelected = packageManager === pkg
                    return (
                      <button
                        key={pkg}
                        type="button"
                        onClick={() => setPackageManager(pkg)}
                        className={cn(
                          "rounded-lg py-1.5 text-xs font-medium capitalize transition-colors",
                          isSelected
                            ? "border border-border bg-muted text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {pkg}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Command block */}
              <div className="my-4 flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs">
                <div className="select-all overflow-x-auto whitespace-nowrap pr-2 text-foreground">
                  <span className="mr-1 text-muted-foreground">$</span>
                  {command}
                </div>
                <button
                  onClick={copy}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy command"
                >
                  {copied ? <CheckIcon className="size-4 text-green-600" /> : <CopyIcon className="size-4" />}
                </button>
              </div>

              {target === "existing" && (
                <p className="-mt-1 mb-3 text-[11px] leading-4 text-muted-foreground">
                  Run inside a project already set up with{" "}
                  <span className="font-mono text-foreground">lovdacn init</span>. It restyles all your installed components. Icons are switched manually.
                </p>
              )}

              {/* Main Copy Button */}
              <button
                onClick={copy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.99]"
              >
                {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                {copied ? "Copied!" : "Copy command"}
              </button>
            </div>
          </div>,
          document.body
        )
        : null}
    </div>
  )
}
