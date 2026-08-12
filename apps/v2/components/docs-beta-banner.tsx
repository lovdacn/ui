import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * Beta banner shown at the top of every docs page while beta mode is on.
 *
 * Documentation is the place a reader copies commands from, so it has to state which channel they
 * are reading. It is CSS-gated (`[data-beta-only]`), which keeps this a server component and paints
 * the banner on the first frame instead of popping in after hydration.
 */
export function DocsBetaBanner({ className }: { className?: string }) {
  return (
    <div
      data-beta-only
      className={cn(
        "beta-panel flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-2 text-xs",
        className
      )}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[var(--beta-accent)]" />
      <span className="beta-panel-title font-medium">Beta mode</span>
      <span className="beta-panel-body">
        Install commands on this page use <code className="font-mono">lovdacn@beta</code>, which
        installs from the beta registry and may change before the stable release.
      </span>
      <Link
        href="/docs/components/motion"
        className="beta-panel-title ml-auto shrink-0 font-medium underline underline-offset-2"
      >
        What&rsquo;s in beta
      </Link>
    </div>
  )
}
