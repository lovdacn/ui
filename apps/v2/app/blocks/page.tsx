import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Boxes, LayoutDashboard, ShieldCheck, type LucideIcon } from "lucide-react"

import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"
import { BlocksBetaNotice } from "@/components/blocks-beta-notice"
import {
  type BlockCategory,
  blockCategories,
  blockCategoryMeta,
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

/** Icon shown on each category card. */
const CATEGORY_ICONS: Record<BlockCategory, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Authentication: ShieldCheck,
  Other: Boxes,
}

export default function BlocksPage() {
  const categories = blockCategories.filter(
    (category) => blocksByCategory(category).length > 0
  )

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{title}</PageHeaderHeading>
        <PageHeaderDescription>{description}</PageHeaderDescription>
        <PageActions>
          <Link
            href="/docs/components"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            View Components
          </Link>
        </PageActions>
      </PageHeader>

      <div className="container-wrapper flex-1 py-8 md:py-12">
        <div className="container flex flex-col gap-8 px-6">
          <BlocksBetaNotice />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const meta = blockCategoryMeta[category]
              const count = blocksByCategory(category).length
              const Icon = CATEGORY_ICONS[category]
              return (
                <Link
                  key={category}
                  href={`/blocks/${categorySlug(category)}`}
                  className="group relative flex flex-col gap-5 overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-foreground/20 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/50 text-foreground transition-colors group-hover:bg-accent">
                      <Icon className="size-5" />
                    </div>
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      {count} {count === 1 ? "block" : "blocks"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-lg font-semibold tracking-tight">
                      {meta.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>

                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-foreground">
                    Browse
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
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
