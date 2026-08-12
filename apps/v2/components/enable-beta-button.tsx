"use client"

import { requestBeta } from "@/lib/beta"

/**
 * Turns beta mode on from inside gated content, so a reader who lands on a beta page by link
 * has the switch in front of them instead of having to find the header button.
 */
export function EnableBetaButton({ label = "Turn on Beta mode" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => requestBeta(true)}
      className="beta-pill inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors active:scale-[0.98]"
    >
      <span aria-hidden className="size-1.5 rounded-full bg-[var(--beta-accent)]" />
      <span>{label}</span>
    </button>
  )
}
