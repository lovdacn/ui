import { TriangleAlert } from "lucide-react"

/** Beta banner shown on the Motion / animation docs, in the shared beta accent. */
export function AnimationBetaNotice() {
  return (
    <div className="beta-panel flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
      <TriangleAlert className="beta-panel-title mt-0.5 size-4 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span className="beta-panel-title font-medium">Animations are in beta</span>
        <span className="beta-panel-body">
          The <code>animate</code> / <code>activeAnimate</code> API and the{" "}
          <code>motion</code> engine may change before the stable release. Install it
          with <code>lovdacn@beta</code> and re-check after upgrading. Feedback is
          welcome on GitHub.
        </span>
      </div>
    </div>
  )
}
