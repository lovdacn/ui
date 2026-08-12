import fs from "fs-extra"
import path from "path"
import { createRequire } from "node:module"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  getRegistryUrl,
  isBetaVersion,
  resolveRegistryChannel,
  setRegistryChannel,
} from "./registry-url"

const require = createRequire(import.meta.url)

/**
 * The release channel is derived from the package version in TWO places that must agree:
 * the CLI (runtime download) and the build scripts (generation output). If they diverge,
 * `lovdacn@beta` installs from a registry nobody wrote to, so both are asserted here.
 */
describe("registry channel", () => {
  const originalUrl = process.env.LOVDA_REGISTRY_URL
  const originalChannel = process.env.LOVDA_REGISTRY_CHANNEL

  beforeEach(() => {
    delete process.env.LOVDA_REGISTRY_URL
    delete process.env.LOVDA_REGISTRY_CHANNEL
    setRegistryChannel(undefined)
  })

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.LOVDA_REGISTRY_URL
    else process.env.LOVDA_REGISTRY_URL = originalUrl
    if (originalChannel === undefined) delete process.env.LOVDA_REGISTRY_CHANNEL
    else process.env.LOVDA_REGISTRY_CHANNEL = originalChannel
    setRegistryChannel(undefined)
  })

  it("treats only -beta. prereleases as the beta channel", () => {
    expect(isBetaVersion("1.0.0-beta.7")).toBe(true)
    expect(isBetaVersion("0.1.6")).toBe(false)
    expect(isBetaVersion("1.0.0")).toBe(false)
  })

  it("derives the channel from this package's version", () => {
    const { version } = fs.readJsonSync(path.resolve(__dirname, "../../package.json"))
    expect(resolveRegistryChannel()).toBe(isBetaVersion(version) ? "beta" : "stable")
  })

  it("lets --channel override the derived channel", () => {
    setRegistryChannel("stable")
    expect(resolveRegistryChannel()).toBe("stable")
    setRegistryChannel("beta")
    expect(resolveRegistryChannel()).toBe("beta")
  })

  it("gives LOVDA_REGISTRY_URL precedence over the channel", () => {
    process.env.LOVDA_REGISTRY_URL = "https://example.test/custom"
    setRegistryChannel("beta")
    expect(getRegistryUrl()).toBe("https://example.test/custom")
  })

  it("resolves the beta root inside the workspace for the beta channel", () => {
    setRegistryChannel("beta")
    const resolved = getRegistryUrl()
    expect(resolved.replace(/\\/g, "/")).toMatch(/apps\/v2\/public\/r\/beta$/)
    expect(fs.existsSync(resolved)).toBe(true)
  })

  it("resolves the stable root for the stable channel", () => {
    setRegistryChannel("stable")
    const resolved = getRegistryUrl()
    expect(resolved.replace(/\\/g, "/")).toMatch(/apps\/v2\/public\/r$/)
    expect(fs.existsSync(resolved)).toBe(true)
  })

  it("agrees with the build scripts' channel resolution", () => {
    const buildChannel = require("../../scripts/lib/registry-channel.cjs") as {
      resolveChannel: () => string
      registryRoot: () => string
    }
    expect(buildChannel.resolveChannel()).toBe(resolveRegistryChannel())

    setRegistryChannel(buildChannel.resolveChannel() as "stable" | "beta")
    const cliRoot = path.resolve(getRegistryUrl())
    expect(cliRoot).toBe(path.resolve(buildChannel.registryRoot()))
  })

  it("keeps the frozen stable baseline separate from the beta tree", () => {
    setRegistryChannel("stable")
    const stableRoot = getRegistryUrl()
    setRegistryChannel("beta")
    const betaRoot = getRegistryUrl()
    expect(betaRoot).not.toBe(stableRoot)
    // Motion only exists on the beta line; stable predates it.
    expect(fs.existsSync(path.join(betaRoot, "styles/nativewind/vega/motion.json"))).toBe(true)
    expect(fs.existsSync(path.join(stableRoot, "styles/nativewind/vega/motion.json"))).toBe(false)
  })
})
