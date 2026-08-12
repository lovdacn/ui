import { TriangleAlert } from "lucide-react"

import { EnableBetaButton } from "@/components/enable-beta-button"

/**
 * Shows beta-only content only while beta mode is on, and explains the switch otherwise.
 *
 * Both branches are rendered and CSS picks one (see the `[data-beta-only]` rules in globals.css),
 * which keeps this a server component, avoids a flash of gated content, and keeps the page
 * reachable by link instead of 404ing a reader who arrives from search or a shared URL.
 */
export function BetaGate({
  children,
  title = "This page documents a beta feature",
  description,
}: {
  children: React.ReactNode
  title?: string
  description?: string
}) {
  return (
    <>
      <div
        data-beta-off-only
        className="beta-panel flex flex-col items-start gap-3 rounded-lg border px-4 py-3 text-sm"
      >
        <div className="flex items-start gap-3">
          <TriangleAlert className="beta-panel-title mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="beta-panel-title font-medium">{title}</span>
            <span className="beta-panel-body">
              {description ??
                "Beta features ship on the lovdacn@beta tag and can change before the stable release. Turn on Beta mode to read this page and to see beta install commands across the docs."}
            </span>
          </div>
        </div>
        <EnableBetaButton />
      </div>

      <div data-beta-only>{children}</div>
    </>
  )
}
