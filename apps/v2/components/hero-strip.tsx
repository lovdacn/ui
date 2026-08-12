import { cn } from "@/lib/utils"

/**
 * The hero's stack strip, replaced by a Beta mode marker while beta is on.
 *
 * Both variants are rendered and CSS shows one (see the `[data-beta-only]` rules in globals.css),
 * so this stays a server component and the correct strip is painted on first frame — the reader
 * never sees the stack pills flip to "Beta mode" after load.
 */
export function HeroStrip({ className }: { className?: string }) {
  const shell =
    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium backdrop-blur-sm"

  return (
    <>
      <div
        data-beta-off-only
        className={cn(shell, "border-border bg-muted/60 text-muted-foreground", className)}
      >
        <span>Expo</span>
        <span className="text-muted-foreground/40">•</span>
        <span>NativeWind</span>
        <span className="text-muted-foreground/40">•</span>
        <span>Uniwind</span>
        <span className="text-muted-foreground/40">•</span>
        <span>shadcn-style</span>
      </div>

      <div data-beta-only className={cn(shell, "beta-pill", className)}>
        <span aria-hidden className="size-1.5 rounded-full bg-[var(--beta-accent)]" />
        <span>Beta mode</span>
        <span className="opacity-40">•</span>
        <span className="font-normal">lovdacn@beta</span>
      </div>
    </>
  )
}
