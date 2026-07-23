"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { getExpoPreviewUrl, expoPreviewOrigin } from "@/lib/preview"

/** Live preview frame for docs — embeds Expo Web components. */
export function ComponentPreviewCard({
  children,
  className,
  title,
  name,
}: {
  children?: React.ReactNode
  className?: string
  title?: string
  name?: string
}) {
  const componentName = name ?? title?.toLowerCase().replace(/ /g, "-")
  const hasTallBlockPreview = [
    "login-03",
    "login-04",
    "signup-02",
    "signup-03",
  ].includes(componentName ?? "")
  const { resolvedTheme } = useTheme()
  const [readySrc, setReadySrc] = React.useState<string | null>(null)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  const colorScheme = React.useMemo(() => {
    if (resolvedTheme) return resolvedTheme
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return "light"
  }, [resolvedTheme])

  // Stable src — only the component lives in the URL. The color scheme is
  // delivered live via postMessage so toggling dark mode never reloads (or
  // flashes) the iframe.
  const src = React.useMemo(
    () => (componentName ? getExpoPreviewUrl({ component: componentName, chrome: "web" }) : ""),
    [componentName]
  )
  const ready = readySrc === src

  // Only trust the "ready" ping from this card's own iframe.
  React.useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return
      if ((e.data as { type?: string })?.type === "lvcn:ready") {
        setReadySrc(src)
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [src])

  // Push the color scheme once the presenter is ready, and whenever it changes.
  React.useEffect(() => {
    if (!ready) return
    iframeRef.current?.contentWindow?.postMessage(
      { type: "lvcn:preset", colorScheme },
      expoPreviewOrigin
    )
  }, [ready, colorScheme])

  return (
    <div
      className={cn(
        "my-6 overflow-hidden rounded-xl border border-border bg-background shadow-sm",
        className
      )}
    >
      <div
        className={cn(
          "relative flex w-full items-center justify-center bg-muted/5",
          hasTallBlockPreview
            ? "min-h-[760px]"
            : "aspect-video min-h-[450px]"
        )}
      >
        {componentName ? (
          <iframe
            ref={iframeRef}
            src={src}
            className={cn(
              "w-full border-0 transition-opacity duration-300",
              hasTallBlockPreview ? "h-[760px]" : "h-[450px]",
              ready ? "opacity-100" : "opacity-0"
            )}
            title={`${title} Live Preview`}
          />
        ) : (
          children ?? (
            <div className="flex flex-col items-center gap-2 text-center p-8">
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-4 text-sm text-muted-foreground">
                No preview available
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
