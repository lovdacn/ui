import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { COMPONENTS } from "@/lib/components"
import { siteConfig } from "@/lib/config"
import { VenomCanvas } from "@/components/venom-canvas"
import { HeroStrip } from "@/components/hero-strip"

const title = "lvcn - The UI Toolkit for React Native & Expo"
const description =
  "A set of beautifully designed Expo components you can customize, extend, and build on. NativeWind & Uniwind. Open Source. Open Code."

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: siteConfig.url,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
}

const eyebrow =
  "font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

const features = [
  {
    label: "01 / Open Code",
    title: "Open Code",
    body: "Components live in your repo. Edit, extend, and own every line — just like shadcn/ui.",
    className: "md:col-span-2",
  },
  {
    label: "02 / Engines",
    title: "Style Engines",
    body: "Choose NativeWind or Uniwind. Ten visual styles and nine base colors out of the box.",
    className: "",
  },
]

const workflow = [
  {
    title: "Initialize",
    body: "Set up your Expo project with your style engine and base color.",
    command: "npx lvcn init",
  },
  {
    title: "Add components",
    body: "Copy only the components you need straight into your repo.",
    command: "npx lvcn add button",
  },
  {
    title: "Make it yours",
    body: "Edit the source and tweak theme tokens. It is all your code.",
    command: "npx expo start",
  },
]

const buttonSnippet = `import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function Screen() {
  return (
    <Button onPress={() => console.log("hi")}>
      <Text>Get started</Text>
    </Button>
  )
}`

const showcase = [
  {
    label: "Ownership",
    title: "Copied into your repo",
    body: "The CLI adds source files to your project, so you can read and change every line.",
  },
  {
    label: "Styling",
    title: "Tailwind classes on native",
    body: "Style with NativeWind or Uniwind using the utility classes you already know.",
  },
  {
    label: "Theming",
    title: "Tokens, not hardcoded colors",
    body: "Pick a style and base color, then adjust the theme in one place.",
  },
]

export default function IndexPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Transition layer: sweeps the dot field and eases the whole page into
            the orange beta theme. Triggered from the Beta button in the header. */}
        <VenomCanvas className="-z-[5]" />
        <div className="container-wrapper">
          <div className="container flex flex-col items-center gap-2 px-6 pt-10 pb-14 text-center md:pt-16 md:pb-20 lg:pt-20 lg:pb-24">
            {/* Decorative background grid and glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,var(--color-foreground),transparent)] opacity-10 dark:opacity-20" />
              <div className="animate-glow-pulse absolute left-1/2 top-0 h-80 w-[44rem] max-w-full -translate-x-1/2 rounded-full bg-orange-500/25 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(var(--color-muted-foreground)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30 dark:opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_85%)]" />
            </div>

            <HeroStrip className="mb-6" />

            <h1
              data-hero-protect
              className="font-heading animate-fade-up mb-6 max-w-4xl text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
            >
              The UI Toolkit for <br className="hidden sm:block" />
              <span className="text-gradient">React Native</span>
            </h1>

            <p className="mb-8 max-w-xl text-base font-normal leading-relaxed text-muted-foreground md:text-lg">
              {description}
            </p>

            <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/create"
                className={`group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg ring-1 ring-primary/20 transition-all hover:-translate-y-0.5 hover:opacity-90 ${focusRing}`}
              >
                Get Started
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/docs/components"
                className={`inline-flex items-center justify-center rounded-md border border-transparent px-6 py-3 text-sm font-medium text-muted-foreground backdrop-blur transition-colors hover:border-border hover:bg-muted hover:text-foreground ${focusRing}`}
              >
                Browse Components
              </Link>
            </div>

            {/* Terminal */}
            <div className="relative mt-12 w-full max-w-2xl text-left">
              <div
                aria-hidden
                className="absolute -inset-px rounded-xl bg-gradient-to-b from-foreground/15 to-transparent blur-sm"
              />
              <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
                  <span aria-hidden className="size-2.5 rounded-full bg-red-500/80" />
                  <span aria-hidden className="size-2.5 rounded-full bg-yellow-500/80" />
                  <span aria-hidden className="size-2.5 rounded-full bg-green-500/80" />
                  <span className="ml-3 font-mono text-[11px] text-muted-foreground">
                    terminal
                  </span>
                </div>
                <div className="space-y-1 p-5 font-mono text-sm leading-7 text-foreground">
                  {["npx lvcn init", "npx lvcn add button"].map((cmd) => (
                    <div
                      key={cmd}
                      className="flex items-center justify-between gap-4 rounded-md px-2 hover:bg-muted/50"
                    >
                      <code className="overflow-x-auto whitespace-nowrap">
                        <span className="select-none text-primary">$ </span>
                        {cmd}
                      </code>
                      <span
                        aria-hidden
                        className="select-none rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                      >
                        copy
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="container-wrapper border-b border-border">
        <div className="container py-16 md:py-20">
          <p className={`${eyebrow} mb-3`}>Workflow</p>
          <h2 className="mb-10 max-w-xl text-2xl font-bold tracking-tighter text-foreground md:text-4xl">
            From zero to shipped in three commands.
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {workflow.map((step, i) => (
              <li
                key={step.title}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/30"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-orange-500/0 blur-3xl transition-colors duration-500 group-hover:bg-orange-500/15"
                />
                <span className="relative font-mono text-xs text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="relative">
                  <h3 className="mb-1 text-base font-bold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
                <code className="relative mt-auto overflow-x-auto whitespace-nowrap rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-foreground">
                  <span className="select-none text-primary">$ </span>
                  {step.command}
                </code>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Code showcase */}
      <section className="container-wrapper border-b border-border">
        <div className="container py-16 md:py-20">
          <p className={`${eyebrow} mb-3`}>Developer experience</p>
          <h2 className="mb-10 max-w-xl text-2xl font-bold tracking-tighter text-foreground md:text-4xl">
            Familiar API. Native feel.
          </h2>
          <div className="group relative grid overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30 lg:grid-cols-2">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 -top-10 size-48 rounded-full bg-orange-500/0 blur-3xl transition-colors duration-500 group-hover:bg-orange-500/15"
            />
            <div className="relative border-b border-border lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
                <span className="font-mono text-[11px] text-muted-foreground">
                  app/index.tsx
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  tsx
                </span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-foreground">
                <code>{buttonSnippet}</code>
              </pre>
            </div>
            <ul className="relative flex flex-col divide-y divide-border">
              {showcase.map((item) => (
                <li key={item.title} className="flex flex-col gap-1 p-6">
                  <p className={eyebrow}>{item.label}</p>
                  <h3 className="text-base font-bold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section className="container-wrapper border-b border-border">
        <div className="container py-16 md:py-20">
          <p className={`${eyebrow} mb-3`}>Why lvcn</p>
          <h2 className="mb-10 max-w-xl text-2xl font-bold tracking-tighter text-foreground md:text-4xl">
            Own your components. Ship faster.
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className={`group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/30 hover:shadow-[0_0_40px_-15px_var(--color-foreground)] ${f.className}`}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-orange-500/0 blur-3xl transition-colors duration-500 group-hover:bg-orange-500/20"
                />
                <p className={`${eyebrow} mb-6`}>{f.label}</p>
                <h3 className="mb-2 text-lg font-bold tracking-tight text-foreground">
                  {f.title}
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
            <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/30 md:col-span-3">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-orange-500/0 blur-3xl transition-colors duration-500 group-hover:bg-orange-500/20"
              />
              <p className={`${eyebrow} mb-6`}>03 / CLI</p>
              <h3 className="mb-2 text-lg font-bold tracking-tight text-foreground">
                CLI First
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Scaffold projects and add components with{" "}
                <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  npx lvcn init
                </code>{" "}
                and{" "}
                <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  npx lvcn add
                </code>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Components Grid Section */}
      <section className="container-wrapper flex-1 border-b border-border">
        <div className="container py-16 md:py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className={`${eyebrow} mb-3`}>Library</p>
              <h2 className="mb-2 text-2xl font-bold tracking-tighter text-foreground md:text-4xl">
                Components
              </h2>
              <p className="text-sm text-muted-foreground">
                {COMPONENTS.length} production-ready components for Expo.
              </p>
            </div>
            <Link
              href="/docs/components"
              className={`rounded-sm text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground ${focusRing}`}
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-border md:grid-cols-2 lg:grid-cols-3 [&>*]:-mb-px [&>*]:-mr-px">
            {COMPONENTS.slice(0, 12).map((component) => (
              <Link
                key={component.name}
                href={`/docs/components/${component.name}`}
                className={`group flex min-h-[140px] flex-col justify-between border-b border-r border-border bg-background p-6 transition-colors hover:bg-muted/50 focus-visible:z-10 ${focusRing}`}
              >
                <div>
                  <span className="mb-3 inline-block rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {component.name}
                  </span>
                  <h3 className="mb-2 text-base font-bold text-foreground">
                    {component.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {component.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              href="/docs/components"
              className={`rounded-md border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted ${focusRing}`}
            >
              See all {COMPONENTS.length} components
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA band */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-[36rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-3xl"
        />
        <div className="container-wrapper">
          <div className="container relative flex flex-col items-center gap-5 px-6 py-16 text-center md:py-24">
            <p className={eyebrow}>Start building</p>
            <h2 className="max-w-xl text-3xl font-bold tracking-tighter text-foreground md:text-5xl">
              Build your next Expo app with lvcn
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/create"
                className={`group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 ${focusRing}`}
              >
                Get Started
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/docs/components"
                className={`inline-flex items-center justify-center rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted ${focusRing}`}
              >
                Browse Components
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
