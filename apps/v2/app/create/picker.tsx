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
}

export function Picker<T extends string>({
  label,
  value,
  options,
  onChange,
  locked,
  onToggleLock,
  renderValue,
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
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-accent/50"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="truncate text-sm font-medium text-foreground">
            {renderValue ? renderValue(value) : current?.label ?? value}
          </span>
        </div>
        {current?.swatch && (
          <span
            className="size-4 shrink-0 rounded-full ring-1 ring-border"
            style={{ backgroundColor: current.swatch }}
          />
        )}
        <ChevronRightIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90"
          )}
        />
      </button>

      {onToggleLock && (
        <button
          type="button"
          onClick={onToggleLock}
          className={cn(
            "absolute top-1/2 right-9 -translate-y-1/2 rounded p-1 transition-opacity",
            locked
              ? "text-foreground opacity-100"
              : "text-muted-foreground opacity-0 group-hover/picker:opacity-100"
          )}
          aria-label={locked ? "Unlock" : "Lock"}
        >
          {locked ? <LockIcon className="size-3" /> : <UnlockIcon className="size-3" />}
        </button>
      )}

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
