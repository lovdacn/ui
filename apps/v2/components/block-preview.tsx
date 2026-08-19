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
import { usePreviewHandshake } from "@/lib/use-preview-handshake"
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
 * via an iframe (the preview app). Readiness uses the session handshake in
 * `lib/preview-protocol.ts`, so a lost `lvcn:ready` costs one retry interval
 * instead of leaving the frame permanently transparent, and the active
 * `colorScheme` travels over `lvcn:preset` so toggling dark mode never reloads.
 */
export function BlockPreview({ block }: { block: BlockMeta }) {
  const { name, title, description } = block
  const { resolvedTheme } = useTheme()
  const [viewport, setViewport] = React.useState<ViewportKey>("desktop")
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const installCommand = `npx lovdacn@latest add ${name}`
  // `chrome=web` renders the desktop-style preview (no phone status bar / clock /
  // battery) — the blocks are shown as a web view here, not a device frame.
  const src = React.useMemo(
    () => getExpoPreviewUrl({ component: name, chrome: "web" }),
    [name]
  )
  const width = VIEWPORTS.find((v) => v.key === viewport)?.width ?? "100%"

  const colorScheme = React.useMemo<"light" | "dark">(() => {
    if (resolvedTheme === "dark" || resolvedTheme === "light") return resolvedTheme
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }
    return "light"
  }, [resolvedTheme])

  const { iframeRef, frameKey, revealed, pending, unreachable, handleLoad, retry } =
    usePreviewHandshake({ src, childOrigin: expoPreviewOrigin, colorScheme })

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

          {/* Install command — to the right of the viewport + open controls */}
          <button
            type="button"
            onClick={() => copyToClipboard(installCommand)}
            aria-label="Copy install command"
            className="group flex h-8 items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 font-mono text-xs transition-colors hover:bg-muted/70"
          >
            <span className="select-none text-muted-foreground">$</span>
            <code className="whitespace-nowrap text-foreground">{installCommand}</code>
            <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
              {isCopied ? (
                <Check className="size-3.5 text-green-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </span>
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        {pending && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted/5 text-sm text-muted-foreground"
            role="status"
          >
            Loading preview…
          </div>
        )}
        <div
          className="mx-auto transition-[max-width] duration-300 ease-in-out"
          data-preview-viewport="true"
          style={{ maxWidth: width }}
        >
          <iframe
            key={frameKey}
            ref={iframeRef}
            src={src}
            onLoad={handleLoad}
            data-preview-frame="true"
            title={`${title} preview`}
            className={cn(
              "w-full border-0 bg-background",
              block.category === "Login" || block.category === "Signup" ? "h-[720px]" : "h-[600px]",
              // Fail open: `revealed` is also true after the readiness timeout, so
              // a loaded frame is never left transparent.
              revealed ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
      </div>
    </section>
  )
}
