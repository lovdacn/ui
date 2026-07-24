import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Boxes, LayoutDashboard, ShieldCheck, type LucideIcon } from "lucide-react"

import { BlockPreview } from "@/components/block-preview"
import { BlocksBetaNotice } from "@/components/blocks-beta-notice"
import {
  type BlockCategory,
  blockCategories,
  blockCategoryMeta,
  blocksByCategory,
  categoryFromSlug,
  categorySlug,
} from "@/lib/blocks"

export const dynamic = "force-static"
export const dynamicParams = false

const CATEGORY_ICONS: Record<BlockCategory, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Authentication: ShieldCheck,
  Other: Boxes,
}

export function generateStaticParams() {
  return blockCategories
    .filter((category) => blocksByCategory(category).length > 0)
    .map((category) => ({ category: categorySlug(category) }))
}

export async function generateMetadata(props: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category: slug } = await props.params
  const category = categoryFromSlug(slug)
  if (!category) return {}
  const meta = blockCategoryMeta[category]
  return {
    title: `${meta.title} Blocks`,
    description: meta.description,
  }
}

export default async function BlockCategoryPage(props: {
  params: Promise<{ category: string }>
}) {
  const { category: slug } = await props.params
  const category = categoryFromSlug(slug)
  if (!category) {
    notFound()
  }

  const meta = blockCategoryMeta[category]
  const items = blocksByCategory(category)
  const Icon = CATEGORY_ICONS[category]
  const count = items.length

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden border-grid border-b">
        <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]">
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40 dark:opacity-25 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
          />
        </div>

        <div className="container-wrapper">
          <div className="container flex flex-col gap-5 px-6 py-10 md:py-14">
            <Link
              href="/blocks"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              All blocks
            </Link>

            <div className="flex items-start gap-4">
              <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50 text-foreground sm:flex">
                <Icon className="size-6" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                    {meta.title}
                  </h1>
                  <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {count} {count === 1 ? "block" : "blocks"}
                  </span>
                </div>
                <p className="max-w-2xl text-base text-muted-foreground">
                  {meta.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content: sticky block index + previews */}
      <div className="container-wrapper flex-1 py-8 md:py-12">
        <div className="container px-6">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No blocks in this category yet.
            </p>
          ) : (
            <div className="grid gap-10 xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-12">
              {/* Sticky index (desktop) */}
              <aside className="hidden xl:block">
                <div className="sticky top-24 flex flex-col gap-3">
                  <span className="px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    On this page
                  </span>
                  <nav className="flex flex-col gap-0.5 border-l border-border">
                    {items.map((block) => (
                      <a
                        key={block.name}
                        href={`#${block.name}`}
                        className="-ml-px flex flex-col border-l border-transparent py-1.5 pl-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                      >
                        <span className="font-medium">{block.title}</span>
                        <span className="font-mono text-[11px] text-muted-foreground/70">
                          {block.name}
                        </span>
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Previews */}
              <div className="flex min-w-0 flex-col gap-6">
                <BlocksBetaNotice />

                {/* Jump chips (mobile / tablet) */}
                <div className="flex flex-wrap gap-1.5 xl:hidden">
                  {items.map((block) => (
                    <a
                      key={block.name}
                      href={`#${block.name}`}
                      className="rounded-full border border-border bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {block.name}
                    </a>
                  ))}
                </div>

                <div className="flex flex-col gap-16">
                  {items.map((block) => (
                    <BlockPreview key={block.name} block={block} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
