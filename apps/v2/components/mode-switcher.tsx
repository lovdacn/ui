"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { META_THEME_COLORS } from "@/lib/config"
import { Button } from "@/components/ui/button"

export function ModeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    const color =
      resolvedTheme === "dark" ? META_THEME_COLORS.dark : META_THEME_COLORS.light
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", color)
  }, [resolvedTheme, mounted])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-8" disabled>
        <SunIcon className="size-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? (
        <SunIcon className="size-4" />
      ) : (
        <MoonIcon className="size-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
