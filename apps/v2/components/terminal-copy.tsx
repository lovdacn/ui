"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { cn } from "@/lib/utils"

export function HeroTerminal({
  commands = ["npx lvcn-ui init", "npx lvcn-ui add button"],
}: {
  commands?: string[]
}) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)
  const { copyToClipboard } = useCopyToClipboard()

  const handleCopy = async (cmd: string, index: number) => {
    await copyToClipboard(cmd)
    setCopiedIndex(index)
    setTimeout(() => {
      setCopiedIndex((current) => (current === index ? null : current))
    }, 2000)
  }

  return (
    <div className="relative mt-12 w-full max-w-2xl text-left">
      <div
        aria-hidden
        className="absolute -inset-px rounded-xl bg-gradient-to-b from-foreground/15 to-transparent blur-sm"
      />
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
          <span aria-hidden className="size-2.5 rounded-full bg-red-500/80" />
          <span aria-hidden className="size-2.5 rounded-full bg-yellow-500/80" />
          <span aria-hidden className="size-2.5 rounded-full bg-green-500/80" />
          <span className="ml-3 font-mono text-[11px] text-muted-foreground">
            terminal
          </span>
        </div>
        <div className="space-y-1 p-5 font-mono text-sm leading-7 text-foreground">
          {commands.map((cmd, i) => {
            const isCopied = copiedIndex === i
            return (
              <button
                key={cmd}
                type="button"
                onClick={() => handleCopy(cmd, i)}
                className="group flex w-full items-center justify-between gap-4 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Copy command: ${cmd}`}
              >
                <code className="overflow-x-auto whitespace-nowrap">
                  <span className="select-none text-primary">$ </span>
                  {cmd}
                </code>
                <span
                  className={cn(
                    "flex shrink-0 select-none items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium tracking-wide transition-all",
                    isCopied
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                      : "border-border bg-muted/40 text-muted-foreground group-hover:border-foreground/30 group-hover:text-foreground"
                  )}
                >
                  {isCopied ? (
                    <>
                      <Check className="size-3 text-emerald-500 dark:text-emerald-400" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 opacity-70 group-hover:opacity-100" />
                      <span>COPY</span>
                    </>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function WorkflowStepCommand({ command }: { command: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  return (
    <button
      type="button"
      onClick={() => copyToClipboard(command)}
      className="group relative mt-auto flex w-full items-center justify-between gap-2 overflow-hidden rounded-md border border-border bg-muted/50 px-3 py-2 text-left font-mono text-xs text-foreground transition-colors hover:border-foreground/30 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Copy command: ${command}`}
    >
      <code className="overflow-x-auto whitespace-nowrap">
        <span className="select-none text-primary">$ </span>
        {command}
      </code>
      <span
        className={cn(
          "flex shrink-0 select-none items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-all",
          isCopied
            ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {isCopied ? (
          <>
            <Check className="size-3 text-emerald-500 dark:text-emerald-400" />
            <span>Copied</span>
          </>
        ) : (
          <Copy className="size-3 opacity-60 group-hover:opacity-100" />
        )}
      </span>
    </button>
  )
}

export function InlineCommandCopy({ command }: { command: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  return (
    <button
      type="button"
      onClick={() => copyToClipboard(command)}
      className="group inline-flex items-center gap-1.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground transition-colors hover:border-foreground/40 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Copy command: ${command}`}
    >
      <code>{command}</code>
      {isCopied ? (
        <Check className="size-3 text-emerald-500 dark:text-emerald-400" />
      ) : (
        <Copy className="size-3 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  )
}
