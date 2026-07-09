import { cn } from "@/lib/utils"

/** Static preview frame for docs — mirrors shadcn preview chrome. */
export function ComponentPreviewCard({
  children,
  className,
  title,
}: {
  children?: React.ReactNode
  className?: string
  title?: string
}) {
  return (
    <div
      className={cn(
        "my-6 overflow-hidden rounded-xl border border-border bg-background",
        className
      )}
    >
      {title && (
        <div className="border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
          {title}
        </div>
      )}
      <div className="flex min-h-[140px] items-center justify-center p-8">
        {children ?? (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-4 text-sm text-muted-foreground">
              Preview available in your Expo app after install
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
