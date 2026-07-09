import Link from "next/link"

import { siteConfig } from "@/lib/config"

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8 md:py-10">
      <div className="container-wrapper px-4 md:px-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            Built for Expo & React Native. Inspired by{" "}
            <Link
              href="https://ui.shadcn.com"
              className="font-medium text-foreground underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              shadcn/ui
            </Link>
            .
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/docs"
              className="hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/docs/components"
              className="hover:text-foreground transition-colors"
            >
              Components
            </Link>
            <Link
              href={siteConfig.links.github}
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
