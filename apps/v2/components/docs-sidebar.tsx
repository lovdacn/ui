"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { COMPONENTS } from "@/lib/components"
import { cn } from "@/lib/utils"

type NavItem = { name: string; href: string; isNew?: boolean }
type NavSection = { title: string; items: NavItem[] }

const SECTIONS: NavSection[] = [
  {
    title: "Get Started",
    items: [
      { name: "Introduction", href: "/docs" },
      { name: "Installation", href: "/docs/installation" },
      { name: "Theming", href: "/docs/theming" },
      { name: "CLI", href: "/docs/cli" },
      { name: "Skills", href: "/docs/skills" },
      { name: "Dark Mode", href: "/docs/dark-mode" },
    ],
  },
  {
    title: "Components",
    items: [
      { name: "All Components", href: "/docs/components" },
      ...COMPONENTS.map((c) => ({
        name: c.title,
        href: `/docs/components/${c.name}`,
        isNew: c.new,
      })),
    ],
  },
]

/** A small "New" pill, mirroring shadcn's new-component marker. */
function NewBadge() {
  return (
    <span className="ml-2 shrink-0 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium leading-none text-green-600 dark:text-green-400">
      New
    </span>
  )
}

export function DocsSidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "sticky top-[calc(var(--header-height)+0.5rem)] hidden h-[calc(100svh-var(--header-height)-2rem)] w-full max-w-56 shrink-0 overflow-y-auto overscroll-contain pr-4 no-scrollbar lg:block",
        className
      )}
    >
      <div className="pb-10 pt-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-6">
            <h4 className="mb-1 px-2 text-xs font-medium text-muted-foreground">
              {section.title}
            </h4>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/docs"
                    ? pathname === "/docs"
                    : pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-md border border-transparent px-2 py-1.5 text-[0.8rem] font-medium transition-colors",
                        isActive
                          ? "border-accent bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="truncate">{item.name}</span>
                      {item.isNew ? <NewBadge /> : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}

export function DocsMobileNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-border lg:hidden">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {SECTIONS.flatMap((s) => s.items)
          .filter(
            (item) =>
              (!item.href.startsWith("/docs/components/") ||
                item.href === "/docs/components") &&
              (!item.href.startsWith("/docs/blocks/") ||
                item.href === "/docs/blocks")
          )
          .map((item) => {
            const isActive =
              item.href === "/docs"
                ? pathname === "/docs"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            )
          })}
      </div>
    </div>
  )
}
