"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type TocItem = {
  depth: number
  url: string
  title: React.ReactNode
}

export function DocsTableOfContents({
  toc,
  className,
}: {
  toc: TocItem[]
  className?: string
}) {
  const [activeId, setActiveId] = React.useState<string>("")

  React.useEffect(() => {
    const headings = toc
      .map((item) => document.getElementById(item.url.slice(1)))
      .filter(Boolean) as HTMLElement[]

    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(`#${entry.target.id}`)
          }
        }
      },
      { rootMargin: "0% 0% -70% 0%", threshold: 0 }
    )

    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [toc])

  if (toc.length === 0) return null

  return (
    <div
      className={cn(
        "sticky top-[calc(var(--header-height)+1.5rem)] hidden h-fit w-full max-w-48 shrink-0 xl:block",
        className
      )}
    >
      <p className="mb-2 text-xs font-medium text-muted-foreground">On This Page</p>
      <ul className="space-y-1.5 border-l border-border">
        {toc.map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              className={cn(
                "block border-l-2 py-0.5 pl-3 text-xs transition-colors",
                item.depth > 2 && "pl-5",
                activeId === item.url
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
