import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mkdir, mkdtemp, rm, writeFile, readFile } from "fs/promises"
import os from "os"
import path from "path"
import prompts from "prompts"
import { execa } from "execa"
import { runInit, initOptionsSchema } from "./init"
import fs from "fs-extra"

vi.mock("prompts", () => ({
  default: vi.fn(),
}))

vi.mock("execa", () => ({
  execa: vi.fn(),
}))

describe("runInit", () => {
  let tempCwd: string
  let mockTemplateDir: string
  let originalEnvTemplateDir: string | undefined
  let originalEnvUserAgent: string | undefined

  beforeEach(async () => {
    // Save original env var
    originalEnvTemplateDir = process.env.LOVDA_TEMPLATE_DIR
    originalEnvUserAgent = process.env.npm_config_user_agent

    // Create temporary workspace directories
    tempCwd = await mkdtemp(path.join(os.tmpdir(), "lovda-test-cwd-"))
    mockTemplateDir = await mkdtemp(path.join(os.tmpdir(), "lovda-test-template-"))

    // Set environment variable to use mock template dir
    process.env.LOVDA_TEMPLATE_DIR = mockTemplateDir
    delete process.env.npm_config_user_agent
    process.env.LOVDA_REGISTRY_URL = path.resolve(__dirname, "../../test/fixtures/registry")

    // Write a dummy file and package.json to the template directory
    await writeFile(
      path.join(mockTemplateDir, "package.json"),
      JSON.stringify({ name: "template-app", dependencies: {} }, null, 2),
      "utf8"
    )
    await writeFile(
      path.join(mockTemplateDir, "index.js"),
      "console.log('hello')",
      "utf8"
    )
    await writeFile(
      path.join(mockTemplateDir, "lvcn.json"),
      JSON.stringify({
        $schema: "https://lvcn.dev/schema.json",
        style: "new-york",
        styleEngine: "nativewind",
        tsx: true,
        tailwind: { config: "tailwind.config.js", css: "global.css" },
        aliases: { components: "@/components", utils: "@/lib/utils", ui: "@/components/ui" },
        components: []
      }, null, 2),
      "utf8"
    )

    // Create nested folders to test filtering
    const nodeModulesPath = path.join(mockTemplateDir, "node_modules")
    const gitPath = path.join(mockTemplateDir, ".git")
    await mkdir(nodeModulesPath)
    await mkdir(gitPath)
    await writeFile(path.join(nodeModulesPath, "some-dep.js"), "dep", "utf8")
    await writeFile(path.join(gitPath, "config"), "git-config", "utf8")

    vi.mocked(execa).mockResolvedValue({} as any)
  })

  afterEach(async () => {
    // Restore env var
    if (originalEnvTemplateDir === undefined) {
      delete process.env.LOVDA_TEMPLATE_DIR
    } else {
      process.env.LOVDA_TEMPLATE_DIR = originalEnvTemplateDir
    }
    delete process.env.LOVDA_REGISTRY_URL
    if (originalEnvUserAgent === undefined) {
      delete process.env.npm_config_user_agent
    } else {
      process.env.npm_config_user_agent = originalEnvUserAgent
    }

    vi.clearAllMocks()

    // Clean up directories
    await rm(tempCwd, { recursive: true, force: true })
    await rm(mockTemplateDir, { recursive: true, force: true })
  })

  it("should initialize project and copy template files (skipping prompts via -y/yes)", async () => {
    const options = {
      cwd: tempCwd,
      name: "my-app",
      yes: true,
      force: false,
    }

    await runInit(options)

    const projectPath = path.join(tempCwd, "my-app")
    
    // Check if files are copied
    const packageJsonContent = await readFile(path.join(projectPath, "package.json"), "utf8")
    const packageJson = JSON.parse(packageJsonContent)

    // Check project name is updated
    expect(packageJson.name).toBe("my-app")

    // Check files copied
    const indexContent = await readFile(path.join(projectPath, "index.js"), "utf8")
    expect(indexContent).toBe("console.log('hello')")

    // Check lvcn.json copied
    const lvcnContent = await readFile(path.join(projectPath, "lvcn.json"), "utf8")
    const lvcn = JSON.parse(lvcnContent)
    expect(lvcn.style).toBe("new-york")
    expect(lvcn.styleEngine).toBe("nativewind")

        // Check ignored files are NOT copied
    await expect(async () => await readFile(path.join(projectPath, "node_modules/some-dep.js"))).rejects.toThrow()
    await expect(async () => await readFile(path.join(projectPath, ".git/config"))).rejects.toThrow()

    // Check dependency installation command called
    expect(execa).toHaveBeenCalledWith(expect.any(String), ["install"], {
      cwd: projectPath,
      stdio: "inherit",
    })
  })

  it("should prompt for project name and package manager if not provided", async () => {
    vi.mocked(prompts).mockResolvedValue({ styleEngine: "nativewind", style: "new-york", baseColor: "zinc", projectName: "prompted-app", packageManager: "pnpm" })

    const options = {
      cwd: tempCwd,
      yes: false,
      force: false,
    }

    await runInit(options)

    const projectPath = path.join(tempCwd, "prompted-app")
    const packageJsonContent = await readFile(path.join(projectPath, "package.json"), "utf8")
    const packageJson = JSON.parse(packageJsonContent)

    expect(packageJson.name).toBe("prompted-app")
    expect(prompts).toHaveBeenCalled()
    expect(execa).toHaveBeenCalledWith("pnpm", ["install"], expect.any(Object))
  })

  it("should support schema parsing validation", () => {
    const parsed = initOptionsSchema.parse({
      cwd: "/some/dir",
      name: "my-project",
      yes: true,
      force: false,
      packageManager: "bun",
    })

    expect(parsed.cwd).toBe("/some/dir")
    expect(parsed.name).toBe("my-project")
    expect(parsed.yes).toBe(true)
    expect(parsed.force).toBe(false)
    expect(parsed.packageManager).toBe("bun")
  })

  it("should prompt for style choice and write it to lvcn.json", async () => {
    vi.mocked(prompts).mockResolvedValue({
      styleEngine: "nativewind",
      style: "mira",
      baseColor: "zinc",
      projectName: "mira-app",
      packageManager: "npm",
    })

    const options = {
      cwd: tempCwd,
      yes: false,
      force: false,
    }

    await runInit(options)

    const projectPath = path.join(tempCwd, "mira-app")
    const lvcnContent = await readFile(path.join(projectPath, "lvcn.json"), "utf8")
    const lvcn = JSON.parse(lvcnContent)

    expect(lvcn.style).toBe("mira")

    const cssPath = path.join(projectPath, "global.css")
    const cssContent = await readFile(cssPath, "utf8")
    expect(cssContent).toContain("--radius: 1.5rem")
  })

  it("should respect packageManager option if provided", async () => {
    const options = {
      cwd: tempCwd,
      name: "my-app",
      yes: true,
      force: false,
      packageManager: "yarn" as const,
    }

    await runInit(options)

    const projectPath = path.join(tempCwd, "my-app")
    expect(execa).toHaveBeenCalledWith("yarn", ["install"], {
      cwd: projectPath,
      stdio: "inherit",
    })
  })

  it("should merge and preserve existing lvcn.json configurations", async () => {
    // Pre-create the directory with package.json and an existing lvcn.json
    const projectPath = path.join(tempCwd, "my-app")
    await mkdir(projectPath, { recursive: true })
    await writeFile(
      path.join(projectPath, "package.json"),
      JSON.stringify({ name: "my-app", dependencies: {} }, null, 2),
      "utf8"
    )
    await writeFile(
      path.join(projectPath, "lvcn.json"),
      JSON.stringify({
        $schema: "https://lvcn.dev/schema.json",
        style: "new-york",
        tsx: true,
        tailwind: { config: "tailwind.config.js", css: "global.css" },
        aliases: { components: "~/components", utils: "~/utils", ui: "~/components/ui" },
        components: ["button", "card"]
      }, null, 2),
      "utf8"
    )

    // Run init with force to skip directory non-empty check
    const options = {
      cwd: tempCwd,
      name: "my-app",
      yes: true,
      force: true,
    }

    await runInit(options)

    // Verify lvcn.json has merged content
    const lvcnContent = await readFile(path.join(projectPath, "lvcn.json"), "utf8")
    const lvcn = JSON.parse(lvcnContent)

    expect(lvcn.style).toBe("new-york") // Preserved style from existing config
    expect(lvcn.aliases.components).toBe("~/components") // Preserved custom alias
    expect(lvcn.components).toContain("button") // Preserved installed components
    expect(lvcn.components).toContain("card") // Preserved installed components
  })

  it("should initialize inside existing projects without creating subdirectories or prompting for project name", async () => {
    // Write package.json inside tempCwd to simulate being in an existing project
    await writeFile(
      path.join(tempCwd, "package.json"),
      JSON.stringify({ name: "existing-expo-app", dependencies: {} }, null, 2),
      "utf8"
    )

    // Pre-create basic babel.config.js to verify nativewind preset insertion
    await writeFile(
      path.join(tempCwd, "babel.config.js"),
      `module.exports = function (api) {
        api.cache(true);
        return {
          presets: ["babel-preset-expo"],
        };
      };`,
      "utf8"
    )

    // Pre-create App.tsx
    await writeFile(
      path.join(tempCwd, "App.tsx"),
      `export default function App() {}`,
      "utf8"
    )

    const options = {
      cwd: tempCwd,
      yes: true,
      force: false,
    }

    await runInit(options)

    // Verify lvcn.json is written inside tempCwd directly (no subfolder created)
    const lvcnPath = path.join(tempCwd, "lvcn.json")
    expect(fs.existsSync(lvcnPath)).toBe(true)

    const lvcn = fs.readJsonSync(lvcnPath)
    expect(lvcn.style).toBe("new-york")
    expect(lvcn.styleEngine).toBe("nativewind")

    // Verify that package.json was NOT overwritten or template files copied (no index.js should exist in tempCwd)
    expect(fs.existsSync(path.join(tempCwd, "index.js"))).toBe(false)

    // Verify metro.config.js is created for nativewind
    const metroPath = path.join(tempCwd, "metro.config.js")
    expect(fs.existsSync(metroPath)).toBe(true)
    const metroContent = await readFile(metroPath, "utf8")
    expect(metroContent).toContain("withNativeWind")

    // Verify babel.config.js is updated with nativewind preset
    const babelContent = await readFile(path.join(tempCwd, "babel.config.js"), "utf8")
    expect(babelContent).toContain("nativewind/babel")

    // Verify global.css is created
    const cssPath = path.join(tempCwd, "global.css")
    expect(fs.existsSync(cssPath)).toBe(true)
    const cssContent = await readFile(cssPath, "utf8")
    expect(cssContent).toContain('@tailwind base')

    // Verify global.css import is injected in App.tsx
    const appContent = await readFile(path.join(tempCwd, "App.tsx"), "utf8")
    expect(appContent).toContain('import "./global.css";')

    // Verify it installed the correct style engine packages
    expect(execa).toHaveBeenCalledWith("npm", ["install", "nativewind", "tailwindcss", "class-variance-authority", "@rn-primitives/portal", "react-native-gesture-handler"], {
      cwd: tempCwd,
      stdio: "inherit",
    })
  })

  it("should add PortalHost to existing expo-router layouts for native overlays", async () => {
    await writeFile(
      path.join(tempCwd, "package.json"),
      JSON.stringify({ name: "existing-expo-app", dependencies: {} }, null, 2),
      "utf8"
    )

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

    await runInit({ cwd: tempCwd, yes: true, force: false })

    const layoutContent = await readFile(path.join(tempCwd, "src/app/_layout.tsx"), "utf8")
    expect(layoutContent).toContain('import { PortalHost } from "@rn-primitives/portal";')
    expect(layoutContent).toContain("<PortalHost />")
    expect(layoutContent.indexOf("<PortalHost />")).toBeLessThan(layoutContent.indexOf("</ThemeProvider>"))
    expect(layoutContent).toContain('import { GestureHandlerRootView } from "react-native-gesture-handler";')
    expect(layoutContent).toContain("<GestureHandlerRootView style={{ flex: 1 }}>")
    expect(layoutContent.indexOf("<GestureHandlerRootView")).toBeLessThan(layoutContent.indexOf("<ThemeProvider"))
    expect(layoutContent.indexOf("</ThemeProvider>")).toBeLessThan(layoutContent.indexOf("</GestureHandlerRootView>"))
  })

  it("should initialize inside existing projects with uniwind if uniwind is in package.json", async () => {
    // Write package.json inside tempCwd with uniwind dependency
    await writeFile(
      path.join(tempCwd, "package.json"),
      JSON.stringify({ name: "existing-expo-app", dependencies: { uniwind: "^1.0.0" } }, null, 2),
      "utf8"
    )

    // Pre-create src/app/_layout.tsx
    await fs.ensureDir(path.join(tempCwd, "src/app"))
    await writeFile(
      path.join(tempCwd, "src/app/_layout.tsx"),
      `export default function Layout() {}`,
      "utf8"
    )

    const options = {
      cwd: tempCwd,
      yes: true,
      force: false,
    }

    await runInit(options)

    // Verify lvcn.json
    const lvcnPath = path.join(tempCwd, "lvcn.json")
    expect(fs.existsSync(lvcnPath)).toBe(true)
    const lvcn = fs.readJsonSync(lvcnPath)
    expect(lvcn.styleEngine).toBe("uniwind")

    // Verify metro.config.js is created for uniwind
    const metroPath = path.join(tempCwd, "metro.config.js")
    expect(fs.existsSync(metroPath)).toBe(true)
    const metroContent = await readFile(metroPath, "utf8")
    expect(metroContent).toContain("withUniwindConfig")

    // Verify global.css includes uniwind import (and relative path has src/global.css since src exists)
    const cssPath = path.join(tempCwd, "src/global.css")
    expect(fs.existsSync(cssPath)).toBe(true)
    const cssContent = await readFile(cssPath, "utf8")
    expect(cssContent).toContain('@import "uniwind"')

    // Verify global.css import is injected in src/app/_layout.tsx as relative path
    const layoutContent = await readFile(path.join(tempCwd, "src/app/_layout.tsx"), "utf8")
    expect(layoutContent).toContain('import "../global.css";')

    // Verify it installed uniwind packages
    expect(execa).toHaveBeenCalledWith("npm", ["install", "uniwind", "tailwindcss", "class-variance-authority", "@rn-primitives/portal", "react-native-gesture-handler"], {
      cwd: tempCwd,
      stdio: "inherit",
    })

    // Uniwind @theme block must include the shadcn multiplicative radius scale
    // with px-capped container tokens so rounded-lg/xl can never oval out.
    expect(cssContent).toContain("--radius-md: calc(var(--radius) * 0.8)")
    expect(cssContent).toContain("--radius-sm: calc(var(--radius) * 0.6)")
    expect(cssContent).toContain("--radius-lg: min(var(--radius), 20px)")
    expect(cssContent).toContain("--radius-xl: min(calc(var(--radius) * 1.4), 24px)")
    expect(cssContent).toContain("--radius-4xl: min(calc(var(--radius) * 2.6), 32px)")
    // And the color mapping
    expect(cssContent).toContain("--color-primary: var(--primary)")
    expect(cssContent).toContain("--color-background: var(--background)")
  })

  it("should patch existing tailwind.config.js with semantic color mapping (nativewind)", async () => {
    // Existing expo project with a barebones tailwind.config.js (no theme.extend colors)
    await writeFile(
      path.join(tempCwd, "package.json"),
      JSON.stringify({ name: "existing-expo-app", dependencies: {} }, null, 2),
      "utf8"
    )
    await writeFile(
      path.join(tempCwd, "tailwind.config.js"),
      `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
`,
      "utf8"
    )
    await writeFile(
      path.join(tempCwd, "App.tsx"),
      `export default function App() {}`,
      "utf8"
    )

    await runInit({ cwd: tempCwd, yes: true, force: false })

    const tw = await readFile(path.join(tempCwd, "tailwind.config.js"), "utf8")
    // Semantic color mapping bridges CSS vars → Tailwind utilities (bg-primary, text-foreground, etc.)
    expect(tw).toContain('primary: {')
    expect(tw).toContain('DEFAULT: "hsl(var(--primary))"')
    expect(tw).toContain('background: "hsl(var(--background))"')
    // Border radius wired to theme --radius with shadcn multiplicative scale +
    // px-capped container tokens so large-radius styles (mira/rhea) can't oval out.
    expect(tw).toContain('lg: "min(var(--radius), 20px)"')
    expect(tw).toContain('md: "calc(var(--radius) * 0.8)"')
    // Animations for accordion, dialog, etc.
    expect(tw).toContain('tailwindcss-animate')
    expect(tw).toContain('accordion-down')
    expect(tw).toContain('darkMode: "class"')
  })

  it("should not touch tailwind.config.js for uniwind projects (uses @theme)", async () => {
    await writeFile(
      path.join(tempCwd, "package.json"),
      JSON.stringify({ name: "existing-expo-app", dependencies: { uniwind: "^1.0.0" } }, null, 2),
      "utf8"
    )
    const originalTw = `// uniwind app - keep me untouched\nmodule.exports = {}\n`
    await writeFile(path.join(tempCwd, "tailwind.config.js"), originalTw, "utf8")
    await fs.ensureDir(path.join(tempCwd, "src/app"))
    await writeFile(
      path.join(tempCwd, "src/app/_layout.tsx"),
      `export default function Layout() {}`,
      "utf8"
    )

    await runInit({ cwd: tempCwd, yes: true, force: false })

    const tw = await readFile(path.join(tempCwd, "tailwind.config.js"), "utf8")
    expect(tw).toBe(originalTw)
  })
})