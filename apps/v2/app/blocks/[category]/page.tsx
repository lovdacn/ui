import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { BlockPreview } from "@/components/block-preview"
import { BlocksBetaNotice } from "@/components/blocks-beta-notice"
import {
  blockCategories,
  blockCategoryMeta,
  blocksByCategory,
  categoryFromSlug,
  categorySlug,
} from "@/lib/blocks"

export const dynamic = "force-static"
export const dynamicParams = false

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
  const blockTitle = `${meta.title} Blocks`
  const canonicalUrl = `/blocks/${slug}`
  return {
    title: blockTitle,
    description: meta.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: blockTitle,
      description: meta.description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: blockTitle,
      description: meta.description,
    },
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

  return (
    <>
      <PageHeader>
        <Link
          href="/blocks"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All blocks
        </Link>
        <PageHeaderHeading>{meta.title}</PageHeaderHeading>
        <PageHeaderDescription>{meta.description}</PageHeaderDescription>
      </PageHeader>

      <div className="container-wrapper flex-1 py-8 md:py-12">
        <div className="container flex flex-col gap-16 px-6">
          <BlocksBetaNotice />
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No blocks in this category yet.
            </p>
          ) : (
            items.map((block) => <BlockPreview key={block.name} block={block} />)
          )}
        </div>
      </div>
    </>
  )
}
