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
}: {
  children?: React.ReactNode
  className?: string
  title?: string
}) {
  const componentName = title?.toLowerCase().replace(/ /g, "-")
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [ready, setReady] = React.useState(false)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const colorScheme = mounted ? resolvedTheme || "light" : "light"

  // Stable src — only the component lives in the URL. The color scheme is
  // delivered live via postMessage so toggling dark mode never reloads (or
  // flashes) the iframe.
  const src = React.useMemo(
    () => (componentName ? getExpoPreviewUrl({ component: componentName }) : ""),
    [componentName]
  )

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
    <div
      className={cn(
        "my-6 overflow-hidden rounded-xl border border-border bg-background shadow-sm",
        className
      )}
    >
      {title && (
        <div className="border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
          {title}
        </div>
      )}
      <div className="relative w-full aspect-video min-h-[450px] flex items-center justify-center bg-muted/5">
        {componentName ? (
          <iframe
            ref={iframeRef}
            src={src}
            className={cn(
              "w-full h-[450px] border-0 transition-opacity duration-300",
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
