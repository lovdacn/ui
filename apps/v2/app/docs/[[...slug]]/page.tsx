import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { findNeighbour } from "fumadocs-core/page-tree"

import { BlocksBetaNotice } from "@/components/blocks-beta-notice"
import { DocsTableOfContents } from "@/components/docs-toc"
import { buttonVariants } from "@/components/ui/button"
import { mdxComponents } from "@/mdx-components"
import { absoluteUrl, cn } from "@/lib/utils"
import { source } from "@/lib/source"

export const revalidate = false
export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)

  if (!page) {
    notFound()
  }

  const doc = page.data

  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical: absoluteUrl(page.url),
    },
    openGraph: {
      title: doc.title,
      description: doc.description,
      type: "article",
      url: absoluteUrl(page.url),
    },
    twitter: {
      card: "summary_large_image",
      title: doc.title,
      description: doc.description,
    },
  }
}

export default async function DocsPage(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) {
    notFound()
  }

  const doc = page.data
  const MDX = doc.body
  const neighbours = findNeighbour(source.pageTree, page.url)
  const toc =
    doc.toc?.map((item) => ({
      depth: item.depth,
      url: item.url,
      title: item.title,
    })) ?? []
  const isBlocksDoc =
    page.url === "/docs/blocks" || page.url.startsWith("/docs/blocks/")

  return (
    <div
      data-slot="docs"
      className="flex scroll-mt-24 items-stretch pb-8 text-[1.05rem] sm:text-[15px] xl:w-full"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-160 min-w-0 flex-1 flex-col gap-6 px-4 py-6 text-foreground md:px-0 lg:py-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <h1 className="scroll-m-24 text-3xl font-semibold tracking-tight">
                {doc.title}
              </h1>
              <div className="flex gap-2">
                {neighbours.previous && (
                  <Link
                    href={neighbours.previous.url}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "icon" }),
                      "size-8 shadow-none"
                    )}
                    aria-label="Previous page"
                  >
                    <ArrowLeftIcon className="size-4" />
                  </Link>
                )}
                {neighbours.next && (
                  <Link
                    href={neighbours.next.url}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "icon" }),
                      "size-8 shadow-none"
                    )}
                    aria-label="Next page"
                  >
                    <ArrowRightIcon className="size-4" />
                  </Link>
                )}
              </div>
            </div>
            {doc.description && (
              <p className="text-[1.05rem] text-muted-foreground sm:text-base md:max-w-[80%]">
                {doc.description}
              </p>
            )}
          </div>

          {isBlocksDoc && <BlocksBetaNotice />}

          <div className="docs-prose w-full flex-1 pb-12">
            <MDX components={mdxComponents} />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border pt-6">
            {neighbours.previous ? (
              <Link
                href={neighbours.previous.url}
                className="group flex flex-col gap-1 text-sm"
              >
                <span className="text-muted-foreground">Previous</span>
                <span className="font-medium group-hover:underline underline-offset-4">
                  {neighbours.previous.name}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {neighbours.next ? (
              <Link
                href={neighbours.next.url}
                className="group flex flex-col gap-1 text-right text-sm"
              >
                <span className="text-muted-foreground">Next</span>
                <span className="font-medium group-hover:underline underline-offset-4">
                  {neighbours.next.name}
                </span>
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>

      <DocsTableOfContents toc={toc} className="pt-8" />
    </div>
  )
}
