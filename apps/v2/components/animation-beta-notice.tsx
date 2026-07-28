import { TriangleAlert } from "lucide-react"

/** Amber "beta" banner shown on the Motion / animation docs. */
export function AnimationBetaNotice() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-amber-900 dark:text-amber-200">
          Animations are in beta
        </span>
        <span className="text-amber-800/80 dark:text-amber-200/70">
          The <code>animate</code> / <code>activeAnimate</code> API and the{" "}
          <code>motion</code> engine may change before the stable release. Install it
          with <code>lovdacn@beta</code> and re-check after upgrading. Feedback is
          welcome on GitHub.
        </span>
      </div>
    </div>
  )
}
