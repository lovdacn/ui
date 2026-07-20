import { TriangleAlert } from "lucide-react"

/** Amber "beta" banner shown on the blocks pages. */
export function BlocksBetaNotice() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-amber-900 dark:text-amber-200">
          Blocks are in beta
        </span>
        <span className="text-amber-800/80 dark:text-amber-200/70">
          Block APIs and installed file output may change between releases. Pin the
          components you install and re-check after upgrading.
        </span>
      </div>
    </div>
  )
}
