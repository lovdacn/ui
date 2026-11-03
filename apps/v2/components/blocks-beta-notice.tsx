import { TriangleAlert } from "lucide-react"

/** Beta banner shown on the blocks pages, in the shared beta accent. */
export function BlocksBetaNotice() {
  return (
    <div className="beta-panel flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
      <TriangleAlert className="beta-panel-title mt-0.5 size-4 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span className="beta-panel-title font-medium">Blocks are in beta</span>
        <span className="beta-panel-body">
          Block APIs and installed file output may change between releases. Pin the
          components you install and re-check after upgrading.
        </span>
      </div>
    </div>
  )
}
