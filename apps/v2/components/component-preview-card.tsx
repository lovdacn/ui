"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { getExpoPreviewUrl, expoPreviewOrigin } from "@/lib/preview"
import { usePreviewHandshake } from "@/lib/use-preview-handshake"

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

  const colorScheme = React.useMemo<"light" | "dark">(() => {
    if (resolvedTheme === "dark" || resolvedTheme === "light") return resolvedTheme
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

  // Readiness is a session handshake (see lib/preview-protocol.ts): the request
  // is retried, and a presenter that never answers reveals a recoverable state
  // instead of leaving the frame at opacity 0 forever.
  const { iframeRef, frameKey, revealed, pending, unreachable, handleLoad, retry } =
    usePreviewHandshake({ src, childOrigin: expoPreviewOrigin, colorScheme })

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
          <>
            {pending && !unreachable && (
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
                role="status"
              >
                Loading preview…
              </div>
            )}
            {unreachable && (
              <div
                className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center justify-center gap-3 border-b border-border bg-muted/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm"
                role="alert"
              >
                <span>The live preview did not respond.</span>
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Reload preview
                </button>
                <a
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Open in a new tab
                </a>
              </div>
            )}
            <iframe
              key={frameKey}
              ref={iframeRef}
              src={src}
              onLoad={handleLoad}
              data-preview-frame="true"
              className={cn(
                "w-full border-0",
                hasTallBlockPreview ? "h-[760px]" : "h-[450px]",
                revealed ? "opacity-100" : "opacity-0"
              )}
              title={`${title} Live Preview`}
            />
          </>
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
