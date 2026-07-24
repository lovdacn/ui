"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { blockCategories, categorySlug } from "@/lib/blocks"

export function BlocksNav() {
  const pathname = usePathname()

  const categories = [
    { name: "Featured", href: "/blocks" },
    ...blockCategories.map((cat) => ({
      name: cat,
      href: `/blocks/${categorySlug(cat)}`,
    })),
  ]

  return (
    <div className="relative border-b border-border bg-background">
      <div className="container flex items-center gap-2 overflow-x-auto px-6 py-3 no-scrollbar">
        {categories.map((category) => {
          const isActive =
            category.href === "/blocks"
              ? pathname === "/blocks" || pathname === "/blocks/"
              : pathname === category.href

          return (
            <Link
              key={category.href}
              href={category.href}
              className={`flex h-8 shrink-0 items-center justify-center rounded-full px-4 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-background font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-active={isActive}
            >
              {category.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
