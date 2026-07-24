import type { Metadata } from "next"
import { notFound } from "next/navigation"

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
  return blockCategories.map((category) => ({
    category: categorySlug(category),
  }))
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

  const items = blocksByCategory(category)

  return (
    <>
      <BlocksBetaNotice />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No blocks in this category yet.
        </p>
      ) : (
        <div className="flex flex-col gap-16 md:gap-24">
          {items.map((block) => (
            <BlockPreview key={block.name} block={block} />
          ))}
        </div>
      )}
    </>
  )
}
