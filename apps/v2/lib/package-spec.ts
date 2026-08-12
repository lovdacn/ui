/**
 * Package spec rewriting for the docs.
 *
 * Kept free of React and of the DOM so the rule that decides what a reader copies is a plain
 * function that can be reasoned about and tested directly.
 *
 * The CLI is published under one name plus a shorthand alias, and the docs use both:
 *
 *   npx lovdacn@latest init
 *   npx lvcn@latest add button
 *
 * Beta mode has to move BOTH to the `beta` tag, because a stable CLI cannot resolve the beta
 * registry (it derives the registry from its own version).
 */

export const STABLE_PACKAGE_TAG = "latest"
export const BETA_PACKAGE_TAG = "beta"

/** Published name first, then the documented shorthand. */
export const PACKAGE_NAMES = ["lovdacn", "lvcn"] as const

export type PackageChannel = "stable" | "beta"

export function tagFor(beta: boolean) {
  return beta ? BETA_PACKAGE_TAG : STABLE_PACKAGE_TAG
}

/** e.g. `lovdacn@beta`. */
export function packageSpec(beta: boolean, name: string = PACKAGE_NAMES[0]) {
  return `${name}@${tagFor(beta)}`
}

/** Every `<name>@latest` spelling the docs may contain. */
export const STABLE_SPECS = PACKAGE_NAMES.map((name) => `${name}@${STABLE_PACKAGE_TAG}`)

/** True when this text belongs to a command that installs the CLI. */
export function containsPackageSpec(text: string) {
  return STABLE_SPECS.some((spec) => text.includes(spec)) ||
    PACKAGE_NAMES.some((name) => text.includes(`${name}@`))
}

/**
 * Rewrite every `<name>@latest` in `text` to the requested channel.
 *
 * `blockHasSpec` reports whether the surrounding code block contains a full spec. Syntax
 * highlighting can split a spec across elements, so when the caller is walking a block that
 * definitely contains one, a fragment holding only the tag is rewritten too.
 *
 * Always call this with the ORIGINAL authored text, never with a previous result, so toggling is
 * exact in both directions.
 */
export function rewritePackageSpec(text: string, beta: boolean, blockHasSpec = false): string {
  if (!beta) return text

  let out = text
  for (const name of PACKAGE_NAMES) {
    out = out.replaceAll(`${name}@${STABLE_PACKAGE_TAG}`, `${name}@${BETA_PACKAGE_TAG}`)
  }
  if (out !== text) return out

  if (blockHasSpec && text.includes(STABLE_PACKAGE_TAG)) {
    return text.replaceAll(STABLE_PACKAGE_TAG, BETA_PACKAGE_TAG)
  }
  return out
}
