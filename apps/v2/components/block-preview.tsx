"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  Check,
  Copy,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react"

import type { BlockMeta } from "@/lib/blocks"
import { expoPreviewOrigin, getExpoPreviewUrl } from "@/lib/preview"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const VIEWPORTS = [
  { key: "desktop", label: "Desktop", width: "100%", icon: Monitor },
  { key: "tablet", label: "Tablet", width: "768px", icon: Tablet },
  { key: "mobile", label: "Mobile", width: "390px", icon: Smartphone },
] as const

type ViewportKey = (typeof VIEWPORTS)[number]["key"]

/**
 * A single block entry for the gallery — a shadcn-style "view" of the block: a
 * header, a full-length install command, and a live Expo Web preview embedded
 * via an iframe (the preview app). The presenter posts `lvcn:ready`, we reply
 * with the active `colorScheme` via `lvcn:preset` so toggling dark mode never
 * reloads the frame.
 */
export function BlockPreview({ block }: { block: BlockMeta }) {
  const { name, title, description } = block
  const { resolvedTheme } = useTheme()
  const [viewport, setViewport] = React.useState<ViewportKey>("desktop")
  const [ready, setReady] = React.useState(false)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const installCommand = `npx lovdacn@latest add ${name}`
  // `chrome=web` renders the desktop-style preview (no phone status bar / clock /
  // battery) — the blocks are shown as a web view here, not a device frame.
  const src = React.useMemo(
    () => getExpoPreviewUrl({ component: name, chrome: "web" }),
    [name]
  )
  const width = VIEWPORTS.find((v) => v.key === viewport)?.width ?? "100%"

  const colorScheme = React.useMemo(() => {
    if (resolvedTheme) return resolvedTheme
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }
    return "light"
  }, [resolvedTheme])

  // Reset the ready gate if the embedded component changes.
  React.useEffect(() => {
    setReady(false)
  }, [src])

  // Only trust the "ready" ping from this card's own iframe.
  React.useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return
      if ((e.data as { type?: string })?.type === "lvcn:ready") setReady(true)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  // Push the color scheme once the presenter is ready, and whenever it changes.
  React.useEffect(() => {
    if (!ready) return
    iframeRef.current?.contentWindow?.postMessage(
      { type: "lvcn:preset", colorScheme },
      expoPreviewOrigin
    )
  }, [ready, colorScheme])

  return (
    <section id={name} className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              {name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden items-center gap-0.5 rounded-lg border border-border p-0.5 md:flex">
            {VIEWPORTS.map((v) => {
              const Icon = v.icon
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setViewport(v.key)}
                  aria-label={v.label}
                  aria-pressed={viewport === v.key}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground",
                    viewport === v.key && "bg-muted text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                </button>
              )
            })}
          </div>

          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            aria-label="Open preview in a new tab"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "size-8"
            )}
          >
            <ExternalLink />
          </a>
        </div>
      </div>

      {/* Full-length install command */}
      <button
        type="button"
        onClick={() => copyToClipboard(installCommand)}
        aria-label="Copy install command"
        className="group flex w-full items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-left font-mono text-sm transition-colors hover:bg-muted/70"
      >
        <span className="select-none text-muted-foreground">$</span>
        <code className="no-scrollbar flex-1 overflow-x-auto whitespace-nowrap text-foreground">
          {installCommand}
        </code>
        <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
          {isCopied ? (
            <Check className="size-4 text-green-500" />
          ) : (
            <Copy className="size-4" />
          )}
        </span>
      </button>

      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        {!ready && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted/5 text-sm text-muted-foreground">
            Loading preview…
          </div>
        )}
        <div
          className="mx-auto transition-[max-width] duration-300 ease-in-out"
          style={{ maxWidth: width }}
        >
          <iframe
            ref={iframeRef}
            src={src}
            title={`${title} preview`}
            className={cn(
              "h-[600px] w-full border-0 bg-background transition-opacity duration-300",
              ready ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
      </div>
    </section>
  )
}
