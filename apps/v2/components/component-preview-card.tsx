"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { getExpoPreviewUrl } from "@/lib/preview"

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

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const themeParam = mounted ? (resolvedTheme || "light") : "light"

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
            src={getExpoPreviewUrl({
              component: componentName,
              colorScheme: themeParam,
            })}
            className="w-full h-[450px] border-0"
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
