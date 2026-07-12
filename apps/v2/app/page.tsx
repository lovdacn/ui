import Link from "next/link"
import { ArrowRightIcon, SparklesIcon } from "lucide-react"

import { COMPONENTS } from "@/lib/components"
import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const title = "The Foundation for your React Native Design System"
const description =
  "A set of beautifully designed Expo components you can customize, extend, and build on. NativeWind & Uniwind. Open Source. Open Code."

export default function IndexPage() {
  const featured = COMPONENTS.filter((c) => c.featured)
  const preview = featured.length > 0 ? featured : COMPONENTS.slice(0, 6)

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader>
        <div className="mb-2 inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          Expo · NativeWind · Uniwind · shadcn-style
        </div>
        <PageHeaderHeading className="max-w-4xl">{title}</PageHeaderHeading>
        <PageHeaderDescription>{description}</PageHeaderDescription>
        <PageActions>
          <Link
            href="/docs/installation"
            className={cn(buttonVariants({ size: "sm" }), "h-[31px] rounded-lg")}
          >
            Get Started
            <ArrowRightIcon data-icon="inline-end" className="size-3.5" />
          </Link>
          <Link
            href="/docs/components"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-[31px] rounded-lg"
            )}
          >
            Browse Components
          </Link>
        </PageActions>
      </PageHeader>

      <div className="container-wrapper flex-1 border-b border-border">
        <div className="container py-10 md:py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Components
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {COMPONENTS.length} production-ready components for Expo.
              </p>
            </div>
            <Link
              href="/docs/components"
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COMPONENTS.slice(0, 12).map((component) => (
              <Link
                key={component.name}
                href={`/docs/components/${component.name}`}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium tracking-tight group-hover:underline underline-offset-4">
                    {component.title}
                  </h3>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {component.name}
                  </code>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {component.description}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/docs/components"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              See all {COMPONENTS.length} components
            </Link>
          </div>
        </div>
      </div>

      <div className="container-wrapper">
        <div className="container grid gap-8 py-12 md:grid-cols-3 md:py-16">
          {[
            {
              title: "Open Code",
              body: "Components live in your repo. Edit, extend, and own every line — just like shadcn/ui.",
            },
            {
              title: "Style Engines",
              body: "Choose NativeWind or Uniwind. Ten visual styles and nine base colors out of the box.",
            },
            {
              title: "CLI First",
              body: "Scaffold projects and add components with `npx lovda init` and `npx lovda add`.",
            },
          ].map((item) => (
            <div key={item.title} className="space-y-2">
              <h3 className="text-lg font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Create CTA */}
      <div className="container-wrapper border-t border-border">
        <div className="container py-16 md:py-20">
          <Link
            href="/create"
            className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-10 text-center transition-colors hover:bg-muted/40 md:p-14"
          >
            <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-background transition-transform group-hover:scale-110">
              <SparklesIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Create your own design system
              </h2>
              <p className="mx-auto max-w-lg text-sm text-muted-foreground">
                Pick your style, base color, font, icons, and radius. Shuffle for
                inspiration, then copy a single command to scaffold your project.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Open Create
              <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
