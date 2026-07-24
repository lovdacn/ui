import type { Metadata } from "next"

import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { BlocksNav } from "@/components/blocks-nav"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

const title = "Building Blocks for Expo"
const description =
  "Ready-made screens and sections built from lvcn components. Each block installs real Expo Router routes and components into your app — copy, paste, and customize."

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/blocks",
  },
  openGraph: {
    title,
    description,
    url: "/blocks",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
}

export default function BlocksLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

      <BlocksNav />

      <div className="container-wrapper flex-1 py-8 md:py-12">
        <div className="container flex flex-col gap-12 px-6">{children}</div>
      </div>
    </>
  )
}
