import type { MDXComponents } from "mdx/types"
import Link from "next/link"
import defaultMdxComponents from "fumadocs-ui/mdx"

import { ComponentsList } from "@/components/components-list"
import { ComponentPreviewCard } from "@/components/component-preview-card"
import { PackageManagerTabs, PMTabContent } from "@/components/package-manager-tabs"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    a: ({ href = "", children, ...props }) => {
      const isExternal = href.startsWith("http")
      if (isExternal) {
        return (
          <a href={href} target="_blank" rel="noreferrer" {...props}>
            {children}
          </a>
        )
      }
      return (
        <Link href={href} {...props}>
          {children}
        </Link>
      )
    },
    ComponentsList,
    ComponentPreviewCard,
    PackageManagerTabs,
    PMTabContent,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Callout: ({
      children,
      className,
      ...props
    }: React.ComponentProps<"div">) => (
      <div
        className={cn(
          "my-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm",
          className
        )}
        {...props}
      >
        {children}
      </div>
    ),
    Steps: ({ children, className, ...props }: React.ComponentProps<"div">) => (
      <div
        className={cn(
          "my-6 ml-4 border-l border-border pl-6 [counter-reset:step]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    ),
    Step: ({ children, className, ...props }: React.ComponentProps<"h3">) => (
      <h3
        className={cn("step mt-8 text-base font-semibold", className)}
        {...props}
      >
        {children}
      </h3>
    ),
    ...components,
  }
}

export const mdxComponents = getMDXComponents()
