"use client"

import { toggleBeta, useBeta } from "@/lib/beta"
import { cn } from "@/lib/utils"

/**
 * Beta switch.
 *
 * A real switch rather than a decorated button: the track and knob show the current state at a
 * glance, so the control reads as on/off instead of as an action. Off is quiet and neutral so it
 * does not compete with the header; on adopts the burnt-orange accent to match the skin it turns on.
 *
 * `role="switch"` + `aria-checked` is the accessible pairing for a two-state control, and the
 * label is real text rather than an icon so it survives screen readers and small viewports.
 */
export function BetaToggle({ className }: { className?: string }) {
  const beta = useBeta()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={beta}
      aria-label="Beta mode"
      onClick={toggleBeta}
      title={
        beta
          ? "Beta mode is on — showing beta components and beta install commands"
          : "Turn on Beta mode to see beta components and beta install commands"
      }
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-semibold transition-colors active:scale-[0.98]",
        beta
          ? "beta-pill"
          : "border-border/80 bg-muted/40 text-muted-foreground hover:border-border hover:text-foreground",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative h-3.5 w-6 shrink-0 rounded-full transition-colors",
          beta ? "bg-[var(--beta-accent)]" : "bg-foreground/20"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-2.5 rounded-full bg-background shadow-sm transition-all duration-200",
            beta ? "left-[0.8125rem]" : "left-0.5"
          )}
        />
      </span>
      <span className="pr-0.5">Beta</span>
    </button>
  )
}
