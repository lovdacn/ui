import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mkdir, mkdtemp, rm, writeFile, readFile } from "fs/promises"
import os from "os"
import path from "path"
import prompts from "prompts"
import { execa } from "execa"
import { runAdd, addOptionsSchema } from "./add"
import fs from "fs-extra"

vi.mock("prompts", () => ({
  default: vi.fn(),
}))

vi.mock("execa", () => ({
  execa: vi.fn(),
}))

describe("runAdd", () => {
  let tempCwd: string
  let originalEnvRegistryUrl: string | undefined

  beforeEach(async () => {
    // Save original env var
    originalEnvRegistryUrl = process.env.LOVDA_REGISTRY_URL

    // Create temporary workspace directory
    tempCwd = await mkdtemp(path.join(os.tmpdir(), "lovda-test-add-cwd-"))

    // Point LOVDA_REGISTRY_URL to the locally served registry (apps/v2/public/r)
    process.env.LOVDA_REGISTRY_URL = path.resolve(__dirname, "../../../../apps/v2/public/r")

    vi.mocked(execa).mockResolvedValue({} as any)
  })

  afterEach(async () => {
    // Restore env var
    if (originalEnvRegistryUrl === undefined) {
      delete process.env.LOVDA_REGISTRY_URL
    } else {
      process.env.LOVDA_REGISTRY_URL = originalEnvRegistryUrl
    }

    vi.clearAllMocks()

    // Clean up directories
    await rm(tempCwd, { recursive: true, force: true })
  })

  it("should throw an error if lvcn.json is not found", async () => {
    const options = {
      components: ["button"],
      cwd: tempCwd,
      yes: true,
      overwrite: false,
    }

    await expect(runAdd(options)).rejects.toThrow(/lvcn.json/i)
  })

  it("should prompt for components if not provided in options", async () => {
    // Pre-create lvcn.json
    const lvcnConfig = {
      $schema: "https://lovdacn.vercel.app/schema.json",
      style: "new-york",
      tsx: true,
      tailwind: { config: "tailwind.config.js", css: "global.css" },
      aliases: {
        components: "~/components",
        utils: "~/lib/utils",
        ui: "~/components/ui",
      },
      components: [],
    }
    await writeFile(path.join(tempCwd, "lvcn.json"), JSON.stringify(lvcnConfig, null, 2), "utf8")

    // Mock prompts to select "button"
    vi.mocked(prompts).mockResolvedValue({ components: ["button"] })

    const options = {
      components: [],
      cwd: tempCwd,
      yes: true,
      overwrite: false,
    }

    await runAdd(options)

    // Verify button component is written
    const buttonPath = path.join(tempCwd, "components/ui/button.tsx")
    expect(fs.existsSync(buttonPath)).toBe(true)
    expect(prompts).toHaveBeenCalled()
  })

  it("should install component, rewrite aliases, and install dependencies", async () => {
    // Pre-create lvcn.json
    const lvcnConfig = {
      $schema: "https://lovdacn.vercel.app/schema.json",
      style: "new-york",
      tsx: true,
      tailwind: { config: "tailwind.config.js", css: "global.css" },
      aliases: {
        components: "~/components",
        utils: "~/lib/utils",
        ui: "~/components/ui",
      },
      components: [],
    }
    await writeFile(path.join(tempCwd, "lvcn.json"), JSON.stringify(lvcnConfig, null, 2), "utf8")

    const options = {
      components: ["button"],
      cwd: tempCwd,
      yes: true,
      overwrite: false,
    }

    await runAdd(options)

    // Verify button component is written to custom alias ui directory (~/components/ui)
    const buttonPath = path.join(tempCwd, "components/ui/button.tsx")
    expect(fs.existsSync(buttonPath)).toBe(true)

    // Verify rewritten aliases in the button.tsx
    const buttonContent = await readFile(buttonPath, "utf8")
    expect(buttonContent).toContain("import { TextClassContext } from '~/components/ui/text'")
    expect(buttonContent).toContain("import { cn } from '~/lib/utils'")

    // Verify recursively resolved components (text and utils) are written
    const textPath = path.join(tempCwd, "components/ui/text.tsx")
    expect(fs.existsSync(textPath)).toBe(true)
    const textContent = await readFile(textPath, "utf8")
    expect(textContent).toContain("import { cn } from '~/lib/utils'")

    const utilsPath = path.join(tempCwd, "lib/utils.ts")
    expect(fs.existsSync(utilsPath)).toBe(true)

    // Verify npm dependencies installation command was called with all collected packages
    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      ["install", "class-variance-authority", "@rn-primitives/slot", "clsx", "tailwind-merge"],
      {
        cwd: tempCwd,
        stdio: "inherit",
      }
    )

    // Verify all resolved components are registered in lvcn.json
    const updatedConfig = fs.readJsonSync(path.join(tempCwd, "lvcn.json"))
    expect(updatedConfig.components).toContain("button")
    expect(updatedConfig.components).toContain("text")
    expect(updatedConfig.components).toContain("utils")
  })

  it("should install native deps via `expo install` for Expo projects (SDK-pinned versions)", async () => {
    // Pre-create lvcn.json
    const lvcnConfig = {
      $schema: "https://lovdacn.vercel.app/schema.json",
      style: "new-york",
      tsx: true,
      tailwind: { config: "tailwind.config.js", css: "global.css" },
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
        ui: "@/components/ui",
      },
      components: [],
    }
    await writeFile(path.join(tempCwd, "lvcn.json"), JSON.stringify(lvcnConfig, null, 2), "utf8")

    // Mark the project as an Expo project so installs defer to `expo install`.
    await writeFile(
      path.join(tempCwd, "package.json"),
      JSON.stringify({ name: "app", dependencies: { expo: "~57.0.2" } }, null, 2),
      "utf8"
    )

    const options = {
      components: ["button"],
      cwd: tempCwd,
      yes: true,
      overwrite: false,
      packageManager: "npm" as const,
    }

    await runAdd(options)

    // Native/JS deps must be installed through `npx expo install`, not a raw
    // `npm install`, so native modules resolve to the SDK-compatible versions.
    expect(execa).toHaveBeenCalledWith(
      "npx",
      ["expo", "install", "class-variance-authority", "@rn-primitives/slot", "clsx", "tailwind-merge"],
      {
        cwd: tempCwd,
        stdio: "inherit",
      }
    )
  })

  it("should patch PortalHost and install portal dependency for overlay components", async () => {
    const lvcnConfig = {
      $schema: "https://lovdacn.vercel.app/schema.json",
      style: "maia",
      styleEngine: "nativewind",
      tsx: true,
      tailwind: { config: "tailwind.config.js", css: "src/global.css" },
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
        ui: "@/components/ui",
      },
      components: [],
    }
    await writeFile(path.join(tempCwd, "lvcn.json"), JSON.stringify(lvcnConfig, null, 2), "utf8")
    await fs.ensureDir(path.join(tempCwd, "src/app"))
    await writeFile(
      path.join(tempCwd, "src/app/_layout.tsx"),
      `import { ThemeProvider } from "expo-router";

export default function Layout() {
  return (
    <ThemeProvider value={{} as any}>
      <Slot />
    </ThemeProvider>
  )
}
`,
      "utf8"
    )

    await runAdd({ components: ["popover"], cwd: tempCwd, yes: true, overwrite: false })

    const layoutContent = await readFile(path.join(tempCwd, "src/app/_layout.tsx"), "utf8")
    expect(layoutContent).toContain('import { PortalHost } from "@rn-primitives/portal";')
    expect(layoutContent).toContain("<PortalHost />")

    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      [
        "install",
        "@rn-primitives/popover@^1.5.2",
        "@rn-primitives/portal@^1.5.2",
        "@rn-primitives/slot",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        "react-native-gesture-handler",
      ],
      {
        cwd: tempCwd,
        stdio: "inherit",
      }
    )
  })
  it("should install component using default @ aliases", async () => {
    const lvcnConfig = {
      $schema: "https://lovdacn.vercel.app/schema.json",
      style: "new-york",
      tsx: true,
      tailwind: { config: "tailwind.config.js", css: "global.css" },
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
        ui: "@/components/ui",
      },
      components: [],
    }
    await writeFile(path.join(tempCwd, "lvcn.json"), JSON.stringify(lvcnConfig, null, 2), "utf8")

    const options = {
      components: ["button"],
      cwd: tempCwd,
      yes: true,
      overwrite: false,
    }

    await runAdd(options)

    const buttonPath = path.join(tempCwd, "components/ui/button.tsx")
    const buttonContent = await readFile(buttonPath, "utf8")

    expect(buttonContent).toContain("import { TextClassContext } from '@/components/ui/text'")
    expect(buttonContent).toContain("import { cn } from '@/lib/utils'")
    expect(buttonContent).not.toContain("~/components")
    expect(buttonContent).not.toContain("~/lib")
  })
  it("should install component in mira style with per-style overrides", async () => {
    // Pre-create lvcn.json with style: mira
    const lvcnConfig = {
      $schema: "https://lovdacn.vercel.app/schema.json",
      style: "mira",
      tsx: true,
      tailwind: { config: "tailwind.config.js", css: "global.css" },
      aliases: {
        components: "~/components",
        utils: "~/lib/utils",
        ui: "~/components/ui",
      },
      components: [],
    }
    await writeFile(path.join(tempCwd, "lvcn.json"), JSON.stringify(lvcnConfig, null, 2), "utf8")

    const options = {
      components: ["button"],
      cwd: tempCwd,
      yes: true,
      overwrite: false,
    }

    await runAdd(options)

    // Verify button component is written to custom alias ui directory
    const buttonPath = path.join(tempCwd, "components/ui/button.tsx")
    expect(fs.existsSync(buttonPath)).toBe(true)

    // Verify rewritten aliases and distinct mira per-style overrides.
    // Mira applies its per-style CSS (e.g. text-xs/relaxed typography) and its
    // pill shape comes from the bounded --radius variable (1.5rem). On short
    // controls like buttons/inputs this clamps to a full pill, while containers
    // stay rounded rectangles — NOT a hardcoded rounded-full class (that was the
    // old STYLE_TRANSFORMS hack).
    const buttonContent = await readFile(buttonPath, "utf8")
    expect(buttonContent).toContain("text-xs/relaxed")
    expect(buttonContent).not.toContain("rounded-full")
  })
})
