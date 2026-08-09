"use client"

import { useEffect, useRef } from "react"

import {
  BETA_EVENT,
  BETA_SWEEP_EVENT,
  SWEEP_DURATION_MS,
  SWEEP_LEAD,
  betaTarget,
  isBeta,
} from "@/lib/beta"
import { cn } from "@/lib/utils"

type RGB = [number, number, number]

interface Palette {
  /** Burst colour of a dot as the wave passes. */
  burst: RGB
  /** Idle dot colour. */
  dim: RGB
  /** Flash in the centre of a bursting dot. */
  core: RGB
}

type Scheme = "light" | "dark"

/** Default palette — matches the production theme. */
const BASE: Record<Scheme, Palette> = {
  light: {
    burst: [71, 85, 105], // slate-600
    dim: [203, 213, 225], // slate-300
    core: [255, 255, 255],
  },
  dark: {
    burst: [148, 163, 184], // slate-400
    dim: [51, 65, 85], // slate-700
    core: [15, 23, 42], // slate-900
  },
}

/** Beta palette — only used while beta mode is on. */
const ACCENT: Record<Scheme, Palette> = {
  light: {
    burst: [249, 115, 22], // orange-500
    dim: [253, 200, 150],
    core: [255, 255, 255],
  },
  dark: {
    burst: [251, 146, 60], // orange-400
    dim: [88, 32, 12],
    core: [26, 16, 10],
  },
}

const SPACING = 11
const DOT_R = 1.1
const IDLE_ALPHA = 0.5

interface Dot {
  /** Normalised diagonal position, drives the sweep ordering. */
  trigger: number
  /** Idle opacity, faded out near the edges and behind the copy. */
  fade: number
  burstColor: RGB
  dim: RGB
  core: RGB
  burst: number
  decayRate: number
  waveId: number
}

interface Wave {
  id: number
  /** rAF timestamp the wave started at. */
  startedAt: number
  progress: number
  target: Palette
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const rgb = (c: RGB) => `${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])}`

/**
 * Decorative dot field behind the hero. Clicking the hero toggles beta mode,
 * which turns the whole page orange, and the field sweeps across diagonally to
 * carry the transition.
 */
export function VenomCanvas({
  className,
  /** Dots behind this element are dimmed so the sweep never hurts readability. */
  protectSlot = "[data-hero-protect]",
}: {
  className?: string
  protectSlot?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const element = canvasRef.current
    if (!element) return

    // Keep the alpha channel: this layer sits on top of the page background and
    // must never paint an opaque rectangle over it.
    const context = element.getContext("2d")
    if (!context) return

    // Non-nullable aliases so the closures below keep the narrowing.
    const canvas: HTMLCanvasElement = element
    const ctx: CanvasRenderingContext2D = context

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    let disposed = false
    let width = 0
    let height = 0
    let dpr = 0
    let cols = 0
    let rows = 0

    let dots: Dot[] = []

    let scheme: Scheme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
    let accent = isBeta()
    let palette: Palette = accent ? ACCENT[scheme] : BASE[scheme]

    let wave: Wave | null = null
    let waveCounter = 0

    let dirty = true
    let running = false
    let onScreen = true
    let frame = 0

    const targetPalette = () => (accent ? ACCENT[scheme] : BASE[scheme])

    function measure() {
      const rect = canvas.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      const ratio = Math.min(window.devicePixelRatio || 1, 2)

      // Not laid out yet — bail rather than sizing the backing store from a
      // fallback that CSS would then stretch.
      if (w < 8 || h < 8) return false
      if (w === width && h === height && ratio === dpr) return false

      width = w
      height = h
      dpr = ratio
      canvas.width = Math.round(w * ratio)
      canvas.height = Math.round(h * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      cols = Math.max(1, Math.floor(w / SPACING))
      rows = Math.max(1, Math.floor(h / SPACING))
      return true
    }

    /** Position of an element in canvas-local coordinates. */
    function localRect(selector: string): Rect | null {
      const el = document.querySelector(selector)
      if (!el) return null
      const canvasBox = canvas.getBoundingClientRect()
      const box = el.getBoundingClientRect()
      if (box.width < 1 || box.height < 1) return null
      return {
        x: box.left - canvasBox.left,
        y: box.top - canvasBox.top,
        w: box.width,
        h: box.height,
      }
    }

    /**
     * Smooth 0..1 falloff near the edges so the field blends into the page
     * instead of stopping at a hard rectangle.
     */
    function edgeFade(px: number, py: number) {
      const inset = 0.12
      const distance = Math.min(
        px / width,
        (width - px) / width,
        py / height,
        (height - py) / height
      )
      const t = Math.max(0, Math.min(1, distance / inset))
      return t * t * (3 - 2 * t)
    }

    /** Dims dots behind the copy, with a soft 40px transition. */
    function protectFade(px: number, py: number, rect: Rect | null) {
      if (!rect) return 1
      const floor = 0.15
      const band = 40
      const dx = Math.max(rect.x - px, px - (rect.x + rect.w), 0)
      const dy = Math.max(rect.y - py, py - (rect.y + rect.h), 0)
      const t = Math.max(0, Math.min(1, Math.hypot(dx, dy) / band))
      const smooth = t * t * (3 - 2 * t)
      return floor + (1 - floor) * smooth
    }

    function buildGrid() {
      if (cols < 1 || rows < 1) return

      const protect = localRect(protectSlot)
      dots = new Array(cols * rows)

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * SPACING + SPACING / 2
          const py = y * SPACING + SPACING / 2

          const diag = ((width - px) / width + py / height) / 2
          const jitter = (Math.random() - 0.5) * 0.22
          const turbulence =
            Math.sin(px / 90) * Math.cos(py / 70) * 0.13 +
            Math.sin(px / 28 + py / 40) * 0.07 +
            Math.cos(py / 18 - px / 22) * 0.05 +
            Math.sin(px / 11 + py / 9) * 0.025

          dots[y * cols + x] = {
            trigger: Math.max(0, Math.min(1, diag + jitter + turbulence)),
            fade: edgeFade(px, py) * protectFade(px, py, protect),
            burstColor: [...palette.burst] as RGB,
            dim: [...palette.dim] as RGB,
            core: [...palette.core] as RGB,
            burst: 0,
            decayRate: 0.84 + Math.random() * 0.08,
            waveId: -1,
          }
        }
      }
    }

    function recolour(next: Palette) {
      palette = next
      for (const d of dots) {
        if (!d) continue
        d.burstColor = [...next.burst] as RGB
        d.dim = [...next.dim] as RGB
        d.core = [...next.core] as RGB
        d.waveId = -1
        d.burst = 0
      }
      wave = null
      markDirty()
    }

    function startSweep(next: Palette) {
      if (motionQuery.matches || dots.length === 0) {
        recolour(next)
        return
      }
      waveCounter += 1
      wave = {
        id: waveCounter,
        startedAt: performance.now(),
        progress: -SWEEP_LEAD,
        target: next,
      }
      palette = next
      start()
    }

    /**
     * Advance the sweep on wall-clock time so it takes the same amount of time
     * on every refresh rate — and so the wave front stays exactly on the theme
     * wipe, which is animated from the same duration and lead.
     * Returns true while anything is still moving.
     */
    function step(now: number) {
      let active = false

      if (wave) {
        const elapsed = (now - wave.startedAt) / SWEEP_DURATION_MS
        wave.progress = -SWEEP_LEAD + elapsed * (1 + 2 * SWEEP_LEAD)
        if (elapsed >= 1) {
          wave = null
        } else {
          active = true
        }
      }

      for (const d of dots) {
        if (!d) continue

        if (wave && d.waveId !== wave.id && wave.progress >= d.trigger) {
          d.waveId = wave.id
          d.burst = 1
          d.burstColor = [...wave.target.burst] as RGB
          d.dim = [...wave.target.dim] as RGB
          d.core = [...wave.target.core] as RGB
        }

        if (d.burst > 0.001) {
          d.burst *= d.decayRate
          active = true
        } else {
          d.burst = 0
        }
      }

      return active
    }

    function draw() {
      if (dots.length === 0) return

      ctx.clearRect(0, 0, width, height)

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const d = dots[y * cols + x]
          if (!d || d.fade <= 0.02) continue

          const px = x * SPACING + SPACING / 2
          const py = y * SPACING + SPACING / 2
          const burst = d.burst

          if (burst > 0.04) {
            const r = DOT_R + DOT_R * burst * 3 * (0.4 + 0.6 * d.fade)
            ctx.fillStyle = `rgba(${rgb(d.burstColor)},${d.fade})`
            ctx.beginPath()
            ctx.arc(px, py, r, 0, Math.PI * 2)
            ctx.fill()

            if (burst > 0.55) {
              ctx.fillStyle = `rgba(${rgb(d.core)},${((burst - 0.55) / 0.45) * d.fade})`
              ctx.beginPath()
              ctx.arc(px, py, r * 0.45, 0, Math.PI * 2)
              ctx.fill()
            }
            continue
          }

          ctx.fillStyle = `rgba(${rgb(d.dim)},${IDLE_ALPHA * d.fade})`
          ctx.fillRect(px - 0.75, py - 0.75, 1.5, 1.5)
        }
      }
    }

    function tick(now: number) {
      frame = requestAnimationFrame(tick)
      const active = step(now)
      if (!active && !dirty) {
        stop()
        return
      }
      draw()
      dirty = false
      if (!active) stop()
    }

    function start() {
      if (running || disposed || !onScreen || document.hidden) return
      running = true
      frame = requestAnimationFrame(tick)
    }

    function stop() {
      if (!running) return
      cancelAnimationFrame(frame)
      running = false
    }

    function markDirty() {
      dirty = true
      start()
    }

    function rebuild() {
      buildGrid()
      markDirty()
    }

    if (measure()) buildGrid()
    markDirty()

    const resizeObserver = new ResizeObserver(() => {
      if (disposed) return
      // The copy can reflow without the canvas changing size, so re-measure and
      // rebuild on any observed change.
      measure()
      rebuild()
    })
    resizeObserver.observe(canvas)
    const protectEl = document.querySelector(protectSlot)
    if (protectEl) resizeObserver.observe(protectEl)

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting)
        if (onScreen) markDirty()
        else stop()
      },
      { threshold: 0 }
    )
    intersectionObserver.observe(canvas)

    const themeObserver = new MutationObserver(() => {
      const next: Scheme = document.documentElement.classList.contains("dark")
        ? "dark"
        : "light"
      if (next === scheme) return
      scheme = next
      recolour(targetPalette())
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    const handleWindowResize = () => {
      if (measure()) rebuild()
    }
    const handleVisibility = () => {
      if (document.hidden) stop()
      else markDirty()
    }
    /**
     * A change was requested — start sweeping now. The theme cross-fade is
     * scheduled off the same duration, so both land together.
     */
    const handleSweepRequest = (event: Event) => {
      const next = (event as CustomEvent<{ beta: boolean }>).detail?.beta ?? betaTarget()
      if (next === accent) return
      accent = next
      startSweep(targetPalette())
    }
    /** Safety net: if the class changed without a sweep, match it. */
    const handleBetaChange = () => {
      const next = isBeta()
      if (next === accent || wave) return
      accent = next
      recolour(targetPalette())
    }
    const handleMotionChange = () => markDirty()

    window.addEventListener("resize", handleWindowResize)
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener(BETA_SWEEP_EVENT, handleSweepRequest)
    window.addEventListener(BETA_EVENT, handleBetaChange)
    motionQuery.addEventListener("change", handleMotionChange)

    return () => {
      disposed = true
      stop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      themeObserver.disconnect()
      window.removeEventListener("resize", handleWindowResize)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener(BETA_SWEEP_EVENT, handleSweepRequest)
      window.removeEventListener(BETA_EVENT, handleBetaChange)
      motionQuery.removeEventListener("change", handleMotionChange)
    }
  }, [protectSlot])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 block size-full", className)}
    />
  )
}
