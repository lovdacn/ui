"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon, XIcon, Plus } from "lucide-react"
import * as React from "react"

import Image from "next/image"

import { siteConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import { ModeSwitcher } from "@/components/mode-switcher"
import { buttonVariants } from "@/components/ui/button"

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container-wrapper px-4 md:px-6">
        <div className="flex h-(--header-height) items-center gap-4">
          <Link href="/" className="mr-2 flex items-center gap-2 font-semibold">
            <Image
              src="/logo.png"
              alt={`${siteConfig.name} logo`}
              width={24}
              height={24}
              className="rounded-md"
            />
            <span className="hidden sm:inline-block">{siteConfig.name}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {siteConfig.navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/create"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5 font-medium"
              )}
            >
              <Plus className="size-3.5" />
              <span>Create</span>
            </Link>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden sm:inline-flex"
              )}
            >
              GitHub
            </Link>
            <ModeSwitcher />
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "md:hidden"
              )}
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <XIcon className="size-4" /> : <MenuIcon className="size-4" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="flex flex-col gap-1 py-3 md:hidden">
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium",
                  pathname.startsWith(item.href) ||
                    (item.href === "/" && pathname === "/")
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
