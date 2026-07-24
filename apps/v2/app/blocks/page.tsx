import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Boxes,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { BlocksBetaNotice } from "@/components/blocks-beta-notice"
import {
  type BlockCategory,
  blockCategories,
  blockCategoryMeta,
  blocks,
  blocksByCategory,
  categorySlug,
} from "@/lib/blocks"
import { cn } from "@/lib/utils"

export const dynamic = "force-static"

const title = "Building Blocks for Expo"
const description =
  "Ready-made screens and sections built from lvcn components. Each block installs real Expo Router routes and the components it needs — copy, paste, and customize."

export const metadata: Metadata = {
  title,
  description,
}

/** Icon + accent gradient shown on each category card. */
const CATEGORY_STYLE: Record<
  BlockCategory,
  { icon: LucideIcon; gradient: string; glow: string }
> = {
  Dashboard: {
    icon: LayoutDashboard,
    gradient: "from-sky-500 to-indigo-500",
    glow: "group-hover:shadow-indigo-500/20",
  },
  Authentication: {
    icon: ShieldCheck,
    gradient: "from-[#d946ef] to-[#f97316]",
    glow: "group-hover:shadow-fuchsia-500/20",
  },
  Other: {
    icon: Boxes,
    gradient: "from-emerald-500 to-teal-500",
    glow: "group-hover:shadow-emerald-500/20",
  },
}

export default function BlocksPage() {
  const categories = blockCategories.filter(
    (category) => blocksByCategory(category).length > 0
  )

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-grid border-b">
        {/* Decorative backdrop — grid + radial glow, matching the home page. */}
        <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,var(--color-foreground),transparent_80%)] opacity-[0.07] dark:opacity-20"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40 dark:opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          />
        </div>

        <div className="container-wrapper">
          <div className="container flex flex-col items-center gap-4 px-6 py-14 text-center md:py-20 lg:py-24">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
              <Sparkles className="size-3 text-foreground/70" />
              {blocks.length} blocks · Beta
            </span>
            <h1 className="font-heading max-w-3xl text-4xl font-bold tracking-tight text-balance text-foreground lg:text-5xl xl:text-6xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base text-balance text-muted-foreground sm:text-lg">
              {description}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Link
                href={`/blocks/${categorySlug(categories[0] ?? "Authentication")}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Browse blocks
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/docs/components"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-full px-5"
                )}
              >
                View Components
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category gallery */}
      <div className="container-wrapper flex-1 py-10 md:py-14">
        <div className="container flex flex-col gap-8 px-6">
          <BlocksBetaNotice />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const meta = blockCategoryMeta[category]
              const items = blocksByCategory(category)
              const count = items.length
              const { icon: Icon, gradient, glow } = CATEGORY_STYLE[category]
              return (
                <Link
                  key={category}
                  href={`/blocks/${categorySlug(category)}`}
                  className={cn(
                    "group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-xl",
                    glow
                  )}
                >
                  {/* Accent wash on hover */}
                  <div
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-x-0 -top-24 h-40 bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20",
                      gradient
                    )}
                  />

                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                        gradient
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <span className="shrink-0 rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {count} {count === 1 ? "block" : "blocks"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h2 className="font-heading text-xl font-semibold tracking-tight">
                      {meta.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>

                  {/* Peek at the blocks inside this category */}
                  <div className="flex flex-wrap gap-1.5">
                    {items.slice(0, 4).map((block) => (
                      <span
                        key={block.name}
                        className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                      >
                        {block.name}
                      </span>
                    ))}
                    {count > 4 && (
                      <span className="rounded-md px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground/70">
                        +{count - 4} more
                      </span>
                    )}
                  </div>

                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-foreground">
                    Browse category
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
