"use client"

import * as React from "react"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue>({
  value: "",
  onValueChange: () => {},
})

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
  ...props
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
} & React.ComponentProps<"div">) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue ?? ""
  )
  const value = controlledValue ?? uncontrolledValue
  const handleChange = onValueChange ?? setUncontrolledValue

  return (
    <TabsContext value={{ value, onValueChange: handleChange }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext>
  )
}

export function TabsList({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-lg bg-muted p-1 ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children,
  className,
  ...props
}: { value: string } & React.ComponentProps<"button">) {
  const ctx = React.use(TabsContext)
  const isActive = ctx.value === value

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      onClick={() => ctx.onValueChange(value)}
      className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      } ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className,
  ...props
}: { value: string } & React.ComponentProps<"div">) {
  const ctx = React.use(TabsContext)
  if (ctx.value !== value) return null

  return (
    <div role="tabpanel" className={`mt-3 ${className ?? ""}`} {...props}>
      {children}
    </div>
  )
}
