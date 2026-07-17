"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon, XIcon, Plus, Star, ExternalLink } from "lucide-react"
import * as React from "react"

import Image from "next/image"

import { siteConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import { ModeSwitcher } from "@/components/mode-switcher"
import { buttonVariants } from "@/components/ui/button"

function GithubIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function formatStars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [stars, setStars] = React.useState<number | null>(null)

  React.useEffect(() => {
    fetch("https://api.github.com/repos/lovdacn-ui/ui")
      .then((res) => {
        if (!res.ok) throw new Error("API call failed")
        return res.json()
      })
      .then((data) => {
        if (data && typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count)
        }
      })
      .catch((err) => {
        console.error("Failed to fetch github stars:", err)
      })
  }, [])

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
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden sm:inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              <GithubIcon className="size-4" />
              <span>GitHub</span>
              {stars !== null && (
                <div className="ml-1 flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground border border-border/60">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span>{formatStars(stars)}</span>
                </div>
              )}
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
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-xs font-semibold transition-all outline-none h-8 px-3.5 rounded-lg text-white bg-gradient-to-r from-[#d946ef] to-[#f97316] hover:opacity-90 active:scale-[0.98] shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Create</span>
            </Link>
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
