import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { COMPONENTS } from "@/lib/components"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"

const description =
  "A set of beautifully designed Expo components you can customize, extend, and build on. NativeWind & Uniwind. Open Source. Open Code."

export default function IndexPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-transparent to-muted/20 dark:from-muted/20 dark:to-transparent">
        <div className="container-wrapper">
          <div className="container flex flex-col items-center gap-2 px-6 pt-3 pb-8 text-center md:pt-6 md:pb-12 lg:pt-8 lg:pb-16 xl:gap-3">
            {/* Decorative background grid and gradient */}
            <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,var(--color-foreground),transparent_80%)] opacity-15 dark:opacity-25"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,var(--color-muted),transparent_85%)] opacity-60 dark:opacity-85"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-15 dark:opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_90%)]"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border bg-muted/60 text-[11px] font-medium text-muted-foreground mb-5 backdrop-blur-sm">
              <span>Expo</span>
              <span className="text-muted-foreground/40">•</span>
              <span>NativeWind</span>
              <span className="text-muted-foreground/40">•</span>
              <span>Uniwind</span>
              <span className="text-muted-foreground/40">•</span>
              <span>shadcn-style</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 max-w-2xl leading-tight">
              The UI Toolkit for <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60 dark:from-white dark:to-zinc-400">
                React Native
              </span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground font-normal max-w-xl mb-8 leading-relaxed">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto justify-center">
              <Link
                href="/create"
                className="inline-flex items-center justify-center gap-2 bg-foreground hover:opacity-90 text-background font-semibold px-5 py-2.5 rounded-full text-sm transition-all group shadow-lg"
              >
                Get Started
                <ArrowRightIcon className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/docs/components"
                className="inline-flex items-center justify-center border border-border bg-background hover:bg-muted text-foreground font-medium px-5 py-2.5 rounded-full text-sm transition-all"
              >
                Browse Components
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Components Grid Section */}
      <div className="container-wrapper flex-1 border-b border-border">
        <div className="container py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">
                Components
              </h2>
              <p className="text-muted-foreground text-sm">
                {COMPONENTS.length} production-ready components for Expo.
              </p>
            </div>
            <Link
              href="/docs/components"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPONENTS.slice(0, 12).map((component) => (
              <Link
                key={component.name}
                href={`/docs/components/${component.name}`}
                className="group border border-border/50 hover:border-border/80 bg-card hover:bg-muted/40 p-6 rounded-xl transition-colors duration-200 flex flex-col justify-between min-h-[140px]"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="font-bold text-base text-foreground group-hover:text-foreground">
                      {component.title}
                    </h3>
                    <span className="text-[10px] font-mono bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded">
                      {component.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {component.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <Link
              href="/docs/components"
              className="border border-border hover:bg-muted bg-background text-foreground font-medium text-sm px-6 py-2.5 rounded-lg transition-all shadow-sm"
            >
              See all {COMPONENTS.length} components
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Features Section */}
      <div className="container-wrapper">
        <div className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <div>
              <h4 className="font-bold text-foreground mb-3 text-base">Open Code</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Components live in your repo. Edit, extend, and own every line — just like shadcn/ui.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-3 text-base">Style Engines</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose NativeWind or Uniwind. Ten visual styles and nine base colors out of the box.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-3 text-base">CLI First</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Scaffold projects and add components with{" "}
                <code className="text-foreground font-mono text-xs bg-muted px-1.5 py-0.5 rounded border border-border">
                  npx lovda init
                </code>{" "}
                and{" "}
                <code className="text-foreground font-mono text-xs bg-muted px-1.5 py-0.5 rounded border border-border">
                  npx lovda add
                </code>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
