"use client"

import * as React from "react"

import { useBeta } from "@/lib/beta"
import {
  STABLE_SPECS,
  containsPackageSpec,
  rewritePackageSpec,
} from "@/lib/package-spec"

/**
 * Keeps documented install commands on the channel the reader is browsing.
 *
 * Snippets are authored as `lovdacn@latest` (and the `lvcn@latest` shorthand). With beta mode on
 * the reader is looking at beta material, so the commands must install the beta tag — a stable CLI
 * cannot resolve the beta registry.
 *
 * Why the DOM and not the MDX: the snippets are static fenced code in ~60 MDX files, highlighted at
 * build time. Rewriting the rendered text is one small client pass instead of converting every
 * fence into a component, and the copy button stays correct because it reads the DOM.
 *
 * The first value seen for each text node is remembered, and every pass is computed from that
 * original, so toggling back is exact and repeated passes cannot compound.
 */

/** Original text per node, so a pass is always computed from the authored value. */
const originalText = new WeakMap<Text, string>()

function applyTag(root: ParentNode, beta: boolean) {
  for (const block of root.querySelectorAll("code, pre")) {
    // A <pre> wrapping a <code> would be visited twice; the inner pass is a no-op, but skipping
    // keeps the work proportional to the number of real blocks.
    if (block.querySelector("code")) continue

    const full = block.textContent ?? ""
    if (!containsPackageSpec(full)) continue
    const blockHasSpec = STABLE_SPECS.some((spec) => full.includes(spec))

    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode() as Text | null
    while (node) {
      let original = originalText.get(node)
      if (original === undefined) {
        original = node.data
        originalText.set(node, original)
      }
      const next = rewritePackageSpec(original, beta, blockHasSpec)
      if (node.data !== next) node.data = next
      node = walker.nextNode() as Text | null
    }
  }
}

/**
 * Rewrites install commands inside `target` whenever beta mode changes.
 *
 * Renders nothing. Package-manager tabs unmount inactive panels, so a MutationObserver re-runs the
 * pass when a panel mounts. Only `childList` is observed, so the text edits cannot retrigger it.
 */
export function BetaPackageTag({ target = "[data-docs-body]" }: { target?: string }) {
  const beta = useBeta()

  React.useEffect(() => {
    const root = document.querySelector(target)
    if (!root) return

    let frame = 0
    const run = () => {
      frame = 0
      applyTag(root, beta)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(run)
    }

    run()
    const observer = new MutationObserver(schedule)
    observer.observe(root, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [beta, target])

  return null
}
