"use client"

import * as React from "react"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const PM_KEY = "lvcn-pm"

const MANAGERS = [
  { value: "npm", label: "npm" },
  { value: "yarn", label: "yarn" },
  { value: "pnpm", label: "pnpm" },
  { value: "bun", label: "bun" },
] as const

function getStoredPM(): string {
  if (typeof window === "undefined") return "npm"
  try {
    return localStorage.getItem(PM_KEY) ?? "npm"
  } catch {
    return "npm"
  }
}

export function PackageManagerTabs({
  children,
}: {
  children: React.ReactNode
}) {
  const [pm, setPM] = React.useState("npm")

  React.useEffect(() => {
    setPM(getStoredPM())
  }, [])

  const handleChange = React.useCallback((value: string) => {
    setPM(value)
    try {
      localStorage.setItem(PM_KEY, value)
      // Sync other tabs on the same page
      window.dispatchEvent(new StorageEvent("storage", { key: PM_KEY, newValue: value }))
    } catch {}
  }, [])

  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === PM_KEY && e.newValue) {
        setPM(e.newValue)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  return (
    <Tabs
      value={pm}
      onValueChange={handleChange}
      className="my-6 w-full"
    >
      <TabsList>
        {MANAGERS.map((m) => (
          <TabsTrigger key={m.value} value={m.value}>
            {m.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  )
}

export { TabsContent as PMTabContent }
