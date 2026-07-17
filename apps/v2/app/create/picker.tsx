"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon, LockIcon, UnlockIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PickerOption<T extends string> {
  value: T
  label: string
  hint?: string
  swatch?: string
}

interface PickerProps<T extends string> {
  label: string
  value: T
  options: readonly PickerOption<T>[]
  onChange: (value: T) => void
  locked?: boolean
  onToggleLock?: () => void
  renderValue?: (value: T) => React.ReactNode
  icon?: React.ReactNode
}

export function Picker<T extends string>({
  label,
  value,
  options,
  onChange,
  locked,
  onToggleLock,
  renderValue,
  icon,
}: PickerProps<T>) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const current = options.find((o) => o.value === value)

  React.useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  return (
    <div className="group/picker relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-zinc-100/70 hover:bg-zinc-200/70 dark:border-border/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 px-3.5 py-2.5 text-left transition-all duration-200 shadow-xs"
      >
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
          <span className="truncate text-sm font-semibold text-foreground mt-0.5">
            {renderValue ? renderValue(value) : current?.label ?? value}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleLock && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onToggleLock()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  e.preventDefault()
                  onToggleLock()
                }
              }}
              className={cn(
                "rounded p-0.5 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer active:scale-95",
                locked
                  ? "text-foreground opacity-100"
                  : "text-muted-foreground/45 opacity-0 group-hover/picker:opacity-100"
              )}
              aria-label={locked ? "Unlock" : "Lock"}
            >
              {locked ? (
                <LockIcon className="size-3.5" strokeWidth={2.5} />
              ) : (
                <UnlockIcon className="size-3.5" strokeWidth={2.5} />
              )}
            </div>
          )}
          {current?.swatch && (
            <span
              className="size-3.5 shrink-0 rounded-full ring-1 ring-border"
              style={{ backgroundColor: current.swatch }}
            />
          )}
          <ChevronRightIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-90"
            )}
          />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in duration-150 md:left-[calc(100%+8px)] md:top-0 md:w-60 left-0 right-0 top-full mt-1 w-full">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                option.value === value && "bg-accent/50"
              )}
            >
              {option.swatch && (
                <span
                  className="size-3.5 shrink-0 rounded-full ring-1 ring-border"
                  style={{ backgroundColor: option.swatch }}
                />
              )}
              <span className="flex-1 truncate">{option.label}</span>
              {option.hint && (
                <span className="text-xs text-muted-foreground">{option.hint}</span>
              )}
              {option.value === value && (
                <CheckIcon className="size-3.5 shrink-0 text-foreground" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
