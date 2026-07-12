import { Command } from "commander"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs-extra"
import prompts from "prompts"
import { execa } from "execa"
import pc from "picocolors"
import { z } from "zod"

import { REGISTRY_URL } from "../config.js"
import {
  decodePreset,
  isPresetCode,
  FONT_FAMILIES,
  FONT_PACKAGES,
  ICON_PACKAGES,
  RADIUS_VALUES,
  getFontCategory,
  type PresetConfig,
} from "../preset/index.js"
import { DEFAULT_PRESETS } from "../preset/defaults.js"
import { getThemePrimary, getChartRamp } from "../preset/colors.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const initOptionsSchema = z.object({
  cwd: z.string(),
  name: z.string().optional(),
  yes: z.boolean().default(false),
  force: z.boolean().default(false),
  packageManager: z.enum(["npm", "yarn", "pnpm", "bun"]).optional(),
  preset: z.string().optional(),
  engine: z.enum(["nativewind", "uniwind"]).optional(),
})

export const init = new Command()
  .name("init")
  .description("initialize your project and install dependencies")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-n, --name <name>", "the name for the new project.")
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option("-f, --force", "force overwrite of existing files.", false)
  .option(
    "-p, --package-manager <package-manager>",
    "the package manager to use. (npm, yarn, pnpm, bun)"
  )
  .option(
    "--preset <preset>",
    "use a preset configuration (code, named preset, or style name)"
  )
  .option(
    "--engine <engine>",
    "the style engine to use (nativewind, uniwind)"
  )
  .action(async (opts) => {
    try {
      const options = initOptionsSchema.parse({
        ...opts,
        cwd: path.resolve(opts.cwd),
      })
      await runInit(options)
    } catch (error) {
      console.error(pc.red("\nInitialization failed:"))
      console.error(error)
      process.exit(1)
    }
  })

export async function runInit(options: z.infer<typeof initOptionsSchema>) {
  const cwd = options.cwd
  const hasPackageJson = fs.existsSync(path.join(cwd, "package.json"))

  let projectName = options.name
  let packageManager = options.packageManager
  let projectPath: string
  let styleEngine: "nativewind" | "uniwind" = "nativewind"
  let style: string = "new-york"
  let baseColor: string = "zinc"
  let presetConfig: PresetConfig | null = null

  // Resolve --preset if provided
  if (options.preset) {
    const namedPreset = DEFAULT_PRESETS[options.preset]
    if (namedPreset) {
      const { title, description, ...config } = namedPreset
      presetConfig = config
    } else if (isPresetCode(options.preset)) {
      presetConfig = decodePreset(options.preset)
      if (!presetConfig) {
        console.error(pc.red(`Invalid preset code: ${options.preset}`))
        process.exit(1)
      }
    } else {
      console.error(pc.red(`Unknown preset: ${options.preset}`))
      console.error(pc.dim(`Available: ${Object.keys(DEFAULT_PRESETS).join(", ")}, or a preset code.`))
      process.exit(1)
    }

    // Apply preset values
    style = presetConfig.style
    baseColor = presetConfig.baseColor
    console.log(pc.blue(`Using preset: ${pc.cyan(options.preset)}`))
    console.log(pc.dim(`  style: ${style}, base: ${baseColor}, theme: ${presetConfig.theme}, chart: ${presetConfig.chartColor}, font: ${FONT_FAMILIES[presetConfig.font]}, icons: ${presetConfig.iconLibrary}, radius: ${RADIUS_VALUES[presetConfig.radius]}`))
  }

  if (hasPackageJson) {
    // Existing project mode
    projectPath = cwd
    if (!packageManager) {
      packageManager = options.packageManager || getPackageManager(cwd)
    }

    // Detect styleEngine from package.json
    const packageJsonPath = path.join(cwd, "package.json")
    let packageJson: any = {}
    try {
      packageJson = fs.readJsonSync(packageJsonPath)
    } catch { }

    const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) }
    if (deps["uniwind"]) {
      styleEngine = "uniwind"
    } else if (deps["nativewind"]) {
      styleEngine = "nativewind"
    } else if (options.engine) {
      styleEngine = options.engine
    } else {
      if (options.yes) {
        styleEngine = "nativewind"
      } else {
        const response = await prompts({
          type: "select",
          name: "styleEngine",
          message: "Which style engine would you like to use?",
          choices: [
            { title: "NativeWind (default/reusables compatible)", value: "nativewind" },
            { title: "Uniwind", value: "uniwind" }
          ],
          initial: 0
        })
        if (!response.styleEngine) {
          process.exit(0)
        }
        styleEngine = response.styleEngine
      }
    }
  } else {
    // New project mode
    if (options.yes) {
      projectName = projectName || "nativewind-app"
      packageManager = packageManager || getPackageManager(cwd)
      styleEngine = options.engine || "nativewind"
      style = presetConfig ? presetConfig.style : "new-york"
      baseColor = presetConfig ? presetConfig.baseColor : "zinc"
    } else {
      const detectedPM = getPackageManager(cwd)
      const questions: prompts.PromptObject[] = []

      if (!options.engine) {
        questions.push({
          type: "select",
          name: "styleEngine",
          message: "Which style engine would you like to use?",
          choices: [
            { title: "NativeWind (default/reusables compatible)", value: "nativewind" },
            { title: "Uniwind", value: "uniwind" }
          ],
          initial: 0
        })
      }

      if (!presetConfig) {
        questions.push({
          type: "select",
          name: "style",
          message: "Which style would you like to use?",
          choices: [
            { title: "Default", value: "default" },
            { title: "New York", value: "new-york" },
            { title: "Luma", value: "luma" },
            { title: "Lyra", value: "lyra" },
            { title: "Maia", value: "maia" },
            { title: "Mira", value: "mira" },
            { title: "Nova", value: "nova" },
            { title: "Rhea", value: "rhea" },
            { title: "Sera", value: "sera" },
            { title: "Vega", value: "vega" }
          ],
          initial: 1
        })

        questions.push({
          type: "select",
          name: "baseColor",
          message: "Which color would you like to use as the base color?",
          choices: [
            { title: "Zinc", value: "zinc" },
            { title: "Slate", value: "slate" },
            { title: "Stone", value: "stone" },
            { title: "Gray", value: "gray" },
            { title: "Neutral", value: "neutral" },
            { title: "Mauve", value: "mauve" },
            { title: "Olive", value: "olive" },
            { title: "Mist", value: "mist" },
            { title: "Taupe", value: "taupe" }
          ],
          initial: 0
        })
      }

      if (!projectName) {
        questions.push({
          type: "text",
          name: "projectName",
          message: "What is your project named?",
          initial: (prev: any, values: any) => values.styleEngine === "uniwind" ? "uniwind-app" : "nativewind-app",
          validate: (value: string) =>
            value.trim().length === 0 ? "Project name cannot be empty." : true,
        })
      }

      if (!packageManager) {
        const checkInstalled = async (pm: string) => {
          try {
            await execa(pm, ["--version"])
            return true
          } catch {
            return false
          }
        }

        const [npmInstalled, yarnInstalled, pnpmInstalled, bunInstalled] = await Promise.all([
          checkInstalled("npm"),
          checkInstalled("yarn"),
          checkInstalled("pnpm"),
          checkInstalled("bun"),
        ])

        questions.push({
          type: "select",
          name: "packageManager",
          message: "Which package manager would you like to use?",
          choices: [
            { title: "npm" + (npmInstalled ? "" : " (not installed)"), value: "npm", disabled: !npmInstalled },
            { title: "yarn" + (yarnInstalled ? "" : " (not installed)"), value: "yarn", disabled: !yarnInstalled },
            { title: "pnpm" + (pnpmInstalled ? "" : " (not installed)"), value: "pnpm", disabled: !pnpmInstalled },
            { title: "bun" + (bunInstalled ? "" : " (not installed)"), value: "bun", disabled: !bunInstalled },
          ],
          initial: ["npm", "yarn", "pnpm", "bun"].indexOf(detectedPM) !== -1
            ? ["npm", "yarn", "pnpm", "bun"].indexOf(detectedPM)
            : 0,
        })
      }

      const response = await prompts(questions)
      if (
        (!projectName && !response.projectName) ||
        (!packageManager && !response.packageManager) ||
        (!options.engine && !response.styleEngine) ||
        (!presetConfig && (!response.style || !response.baseColor))
      ) {
        process.exit(0)
      }
      projectName = projectName || response.projectName.trim()
      packageManager = packageManager || (response.packageManager as "npm" | "yarn" | "pnpm" | "bun")
      styleEngine = options.engine || response.styleEngine
      // style/baseColor come from preset if provided, else from prompt
      style = presetConfig ? presetConfig.style : response.style
      baseColor = presetConfig ? presetConfig.baseColor : response.baseColor
    }

    if (!packageManager) {
      throw new Error("Package manager is required.")
    }

    projectPath = path.join(cwd, projectName!)

    // Check if project path exists and has files
    if (fs.existsSync(projectPath) && fs.readdirSync(projectPath).length > 0 && !options.force) {
      if (options.yes) {
        throw new Error(`Directory ${projectPath} is not empty. Use --force to overwrite.`)
      }

      const confirm = await prompts({
        type: "confirm",
        name: "overwrite",
        message: `The directory ${pc.cyan(projectName)} is not empty. Would you like to overwrite it?`,
        initial: false,
      })

      if (!confirm.overwrite) {
        console.log(pc.yellow("Aborted."))
        return
      }
    }
  }

  // Try to read existing lvcn.json to preserve configurations if it exists
  let existingLvcnConfig: any = null
  const lvcnJsonPath = path.join(projectPath, "lvcn.json")
  if (fs.existsSync(lvcnJsonPath)) {
    if (!options.force && !options.yes) {
      const confirm = await prompts({
        type: "confirm",
        name: "overwrite",
        message: `Configuration file ${pc.cyan("lvcn.json")} already exists. Overwrite?`,
        initial: false,
      })
      if (!confirm.overwrite) {
        console.log(pc.yellow("Aborted."))
        return
      }
    }
    try {
      existingLvcnConfig = fs.readJsonSync(lvcnJsonPath)
    } catch {
      // Ignore read errors
    }
  }

  // Prompt/set style
  if (existingLvcnConfig && existingLvcnConfig.style) {
    style = existingLvcnConfig.style
  } else if (presetConfig) {
    // style already set from preset
    style = presetConfig.style
  } else if (options.yes) {
    style = "new-york"
  } else if (!hasPackageJson) {
    // Style was already prompted in new project mode prompts
  } else {
    const styleResponse = await prompts({
      type: "select",
      name: "style",
      message: "Which style would you like to use?",
      choices: [
        { title: "Default", value: "default" },
        { title: "New York", value: "new-york" },
        { title: "Luma", value: "luma" },
        { title: "Lyra", value: "lyra" },
        { title: "Maia", value: "maia" },
        { title: "Mira", value: "mira" },
        { title: "Nova", value: "nova" },
        { title: "Rhea", value: "rhea" },
        { title: "Sera", value: "sera" },
        { title: "Vega", value: "vega" }
      ],
      initial: 1
    })
    if (!styleResponse.style) {
      process.exit(0)
    }
    style = styleResponse.style
  }

  // Prompt/set baseColor
  if (existingLvcnConfig && existingLvcnConfig.tailwind?.baseColor) {
    baseColor = existingLvcnConfig.tailwind.baseColor
  } else if (presetConfig) {
    // baseColor already set from preset
    baseColor = presetConfig.baseColor
  } else if (options.yes) {
    baseColor = "zinc"
  } else if (!hasPackageJson) {
    // baseColor was already prompted in new project mode prompts
  } else {
    const baseColorResponse = await prompts({
      type: "select",
      name: "baseColor",
      message: "Which color would you like to use as the base color?",
      choices: [
        { title: "Zinc", value: "zinc" },
        { title: "Slate", value: "slate" },
        { title: "Stone", value: "stone" },
        { title: "Gray", value: "gray" },
        { title: "Neutral", value: "neutral" },
        { title: "Mauve", value: "mauve" },
        { title: "Olive", value: "olive" },
        { title: "Mist", value: "mist" },
        { title: "Taupe", value: "taupe" }
      ],
      initial: 0
    })
    if (!baseColorResponse.baseColor) {
      process.exit(0)
    }
    baseColor = baseColorResponse.baseColor
  }

  // Locate template directory based on styleEngine
  let templateDir = process.env.LOVDA_TEMPLATE_DIR
  if (!templateDir) {
    const distPath = path.resolve(__dirname, `../../templates/${styleEngine}`)
    const srcPath = path.resolve(__dirname, `../../../templates/${styleEngine}`)
    templateDir = fs.existsSync(distPath) ? distPath : srcPath
  }

  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template directory not found at ${templateDir}`)
  }

  // For existing projects, detect src dir from the project we're initializing into.
  // For new projects, we assume the template has a `src` layout (both nativewind and
  // uniwind templates ship a `src/` directory), so the CSS path resolves under `src/`.
  const hasSrcDir = hasPackageJson
    ? fs.existsSync(path.join(projectPath, "src"))
    : fs.existsSync(path.join(templateDir, "src"))
  const cssRelativePath = hasSrcDir ? "./src/global.css" : "./global.css"

  if (hasPackageJson) {
    console.log(pc.blue(`Initializing configurations in existing project...`))

    // 1. Write/merge lvcn.json to existing project root
    fs.writeJsonSync(
      lvcnJsonPath,
      {
        $schema: "https://lvcn.dev/schema.json",
        style: style,
        styleEngine: styleEngine,
        tsx: true,
        tailwind: {
          config: "tailwind.config.js",
          css: cssRelativePath,
          baseColor: baseColor,
        },
        aliases: {
          components: "@/components",
          utils: "@/lib/utils",
          ui: "@/components/ui",
        },
        components: [],
      },
      { spaces: 2 }
    )

    // 2. Setup global.css file
    await configureGlobalCss(projectPath, styleEngine, cssRelativePath, style, baseColor, presetConfig?.theme, presetConfig?.chartColor)
    configureThemeTs(projectPath, baseColor)

    // 3. Configure tailwind.config.js (only for nativewind - uniwind uses @theme in CSS)
    if (styleEngine === "nativewind") {
      const templateTailwindPath = path.join(templateDir, "tailwind.config.js")
      configureTailwindConfig(projectPath, templateTailwindPath)
    }

    // 4. Configure metro.config.js
    configureMetroConfig(projectPath, styleEngine, cssRelativePath, hasSrcDir)

    // 5. Configure babel.config.js (for nativewind only)
    if (styleEngine === "nativewind") {
      configureBabelConfig(projectPath)
    }

    // 6. Configure root file import for global.css and native portal host
    configureRootImport(projectPath, cssRelativePath)
    configurePortalHost(projectPath)
  } else {
    console.log(pc.blue(`Initializing project in ${pc.cyan(projectPath)}...`))

    // Ensure target directory exists
    fs.ensureDirSync(projectPath)

    // Copy template files
    fs.copySync(templateDir, projectPath, {
      filter: (src) => {
        const basename = path.basename(src)
        return (
          !src.includes("node_modules") &&
          basename !== ".git" &&
          basename !== ".expo" &&
          basename !== ".claude"
        )
      },
    })

    // Update package.json name
    const packageJsonPath = path.join(projectPath, "package.json")
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = fs.readJsonSync(packageJsonPath)
      packageJson.name = projectName
      fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 })
    }

    // Adapt workspace config and lockfiles for the target package manager
    adaptScaffoldedProject(projectPath, packageManager!)

    // Setup global.css file with style-specific styles
    await configureGlobalCss(projectPath, styleEngine, cssRelativePath, style, baseColor, presetConfig?.theme, presetConfig?.chartColor)
    configureThemeTs(projectPath, baseColor)
  }

  // Update/merge lvcn.json
  if (fs.existsSync(lvcnJsonPath)) {
    const templateLvcn = fs.readJsonSync(lvcnJsonPath)
    const mergedConfig = {
      ...templateLvcn,
      style: style,
      styleEngine: styleEngine,
      ...(existingLvcnConfig || {}),
      // Preset fields
      baseColor: baseColor,
      ...(presetConfig ? {
        theme: presetConfig.theme,
        chartColor: presetConfig.chartColor,
        font: presetConfig.font,
        iconLibrary: presetConfig.iconLibrary,
        radius: presetConfig.radius,
      } : {}),
      aliases: {
        ...templateLvcn.aliases,
        ...((existingLvcnConfig && existingLvcnConfig.aliases) || {}),
      },
      tailwind: {
        ...templateLvcn.tailwind,
        baseColor: baseColor,
        ...((existingLvcnConfig && existingLvcnConfig.tailwind) || {}),
      },
      components: Array.from(
        new Set([
          ...(templateLvcn.components || []),
          ...((existingLvcnConfig && existingLvcnConfig.components) || []),
        ])
      ),
    }
    fs.writeJsonSync(lvcnJsonPath, mergedConfig, { spaces: 2 })
  }

  console.log(pc.blue(`Installing dependencies using ${pc.cyan(packageManager!)}...`))

  // Install dependencies: in existing project we install only style-engine specific packages, otherwise run full install
  if (hasPackageJson) {
    const deps =
      styleEngine === "uniwind"
        ? ["uniwind", "tailwindcss", "class-variance-authority", "@rn-primitives/portal", "react-native-gesture-handler"]
        : ["nativewind", "tailwindcss", "class-variance-authority", "@rn-primitives/portal", "react-native-gesture-handler"]
    await execa(packageManager!, ["install", ...deps], {
      cwd: projectPath,
      stdio: "inherit",
    })
  } else {
    await execa(packageManager!, ["install"], {
      cwd: projectPath,
      stdio: "inherit",
    })
  }

  // Install preset-specific packages (font + icons)
  if (presetConfig) {
    const presetDeps: string[] = []

    // Font package
    const fontPkg = FONT_PACKAGES[presetConfig.font]
    if (fontPkg) {
      presetDeps.push(fontPkg)
    }

    // Icon library package (skip @expo/vector-icons as it's built-in)
    if (presetConfig.iconLibrary !== "expo") {
      const iconPkg = ICON_PACKAGES[presetConfig.iconLibrary]
      if (iconPkg) {
        presetDeps.push(iconPkg)
        presetDeps.push("react-native-svg")
      }
    }

    if (presetDeps.length > 0) {
      console.log(pc.blue(`Installing preset packages: ${pc.cyan(presetDeps.join(", "))}...`))
      try {
        await execa(packageManager!, ["install", ...presetDeps], {
          cwd: projectPath,
          stdio: "inherit",
        })
      } catch {
        console.log(pc.yellow(`⚠ Could not install some preset packages. Install manually: ${presetDeps.join(" ")}`))
      }
    }
  }

  console.log(pc.green("\nProject initialized successfully! 🎉"))
}

function getPackageManager(cwd: string): "npm" | "yarn" | "pnpm" | "bun" {
  // 1. Check lockfiles in cwd first
  if (fs.existsSync(path.join(cwd, "bun.lockb")) || fs.existsSync(path.join(cwd, "bun.lock"))) return "bun"
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm"
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn"
  if (fs.existsSync(path.join(cwd, "package-lock.json"))) return "npm"

  // 2. Fallback to user agent if no lockfile is found
  const userAgent = process.env.npm_config_user_agent || ""
  if (userAgent.startsWith("pnpm")) return "pnpm"
  if (userAgent.startsWith("bun")) return "bun"
  if (userAgent.startsWith("yarn")) return "yarn"

  return "npm"
}

type ThemeColorMap = Record<
  | "background"
  | "foreground"
  | "card"
  | "card-foreground"
  | "popover"
  | "popover-foreground"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-foreground"
  | "muted"
  | "muted-foreground"
  | "accent"
  | "accent-foreground"
  | "destructive"
  | "destructive-foreground"
  | "border"
  | "input"
  | "ring",
  string
>;

const THEME_COLORS: Record<
  "zinc" | "slate" | "stone" | "gray" | "neutral" | "taupe" | "mauve" | "olive" | "mist",
  {
    hsl: {
      light: ThemeColorMap;
      dark: ThemeColorMap;
    };
    oklch: {
      light: ThemeColorMap;
      dark: ThemeColorMap;
    };
  }
> = {
  zinc: {
    hsl: {
      light: {
        background: "0 0% 100%",
        foreground: "240 10% 3.9%",
        card: "0 0% 100%",
        "card-foreground": "240 10% 3.9%",
        popover: "0 0% 100%",
        "popover-foreground": "240 10% 3.9%",
        primary: "240 5.9% 10%",
        "primary-foreground": "0 0% 98%",
        secondary: "240 4.8% 95.9%",
        "secondary-foreground": "240 5.9% 10%",
        muted: "240 4.8% 95.9%",
        "muted-foreground": "240 3.8% 46.1%",
        accent: "240 4.8% 95.9%",
        "accent-foreground": "240 5.9% 10%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "0 0% 98%",
        border: "240 5.9% 90%",
        input: "240 5.9% 90%",
        ring: "240 5.9% 10%",
      },
      dark: {
        background: "240 10% 3.9%",
        foreground: "0 0% 98%",
        card: "240 10% 3.9%",
        "card-foreground": "0 0% 98%",
        popover: "240 10% 3.9%",
        "popover-foreground": "0 0% 98%",
        primary: "0 0% 98%",
        "primary-foreground": "240 5.9% 10%",
        secondary: "240 3.7% 15.9%",
        "secondary-foreground": "0 0% 98%",
        muted: "240 3.7% 15.9%",
        "muted-foreground": "240 5% 64.9%",
        accent: "240 3.7% 15.9%",
        "accent-foreground": "0 0% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "0 0% 98%",
        border: "240 3.7% 15.9%",
        input: "240 3.7% 15.9%",
        ring: "240 4.9% 83.9%",
      },
    },
    oklch: {
      light: {
        background: "oklch(1 0 0)",
        foreground: "oklch(0.145 0 0)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.145 0 0)",
        popover: "oklch(1 0 0)",
        "popover-foreground": "oklch(0.145 0 0)",
        primary: "oklch(0.205 0 0)",
        "primary-foreground": "oklch(0.985 0 0)",
        secondary: "oklch(0.97 0 0)",
        "secondary-foreground": "oklch(0.205 0 0)",
        muted: "oklch(0.97 0 0)",
        "muted-foreground": "oklch(0.556 0 0)",
        accent: "oklch(0.97 0 0)",
        "accent-foreground": "oklch(0.205 0 0)",
        destructive: "oklch(0.577 0.245 27.325)",
        "destructive-foreground": "oklch(0.97 0 0)",
        border: "oklch(0.922 0 0)",
        input: "oklch(0.922 0 0)",
        ring: "oklch(0.205 0 0)",
      },
      dark: {
        background: "oklch(0.145 0 0)",
        foreground: "oklch(0.985 0 0)",
        card: "oklch(0.145 0 0)",
        "card-foreground": "oklch(0.985 0 0)",
        popover: "oklch(0.145 0 0)",
        "popover-foreground": "oklch(0.985 0 0)",
        primary: "oklch(0.985 0 0)",
        "primary-foreground": "oklch(0.205 0 0)",
        secondary: "oklch(0.269 0 0)",
        "secondary-foreground": "oklch(0.985 0 0)",
        muted: "oklch(0.269 0 0)",
        "muted-foreground": "oklch(0.708 0 0)",
        accent: "oklch(0.269 0 0)",
        "accent-foreground": "oklch(0.985 0 0)",
        destructive: "oklch(0.396 0.141 25.723)",
        "destructive-foreground": "oklch(0.985 0 0)",
        border: "oklch(0.269 0 0)",
        input: "oklch(0.269 0 0)",
        ring: "oklch(0.87 0 0)",
      },
    },
  },
  neutral: {
    hsl: {
      light: {
        background: "0 0% 100%",
        foreground: "0 0% 3.9%",
        card: "0 0% 100%",
        "card-foreground": "0 0% 3.9%",
        popover: "0 0% 100%",
        "popover-foreground": "0 0% 3.9%",
        primary: "0 0% 9%",
        "primary-foreground": "0 0% 98%",
        secondary: "0 0% 96.1%",
        "secondary-foreground": "0 0% 9%",
        muted: "0 0% 96.1%",
        "muted-foreground": "0 0% 45.1%",
        accent: "0 0% 96.1%",
        "accent-foreground": "0 0% 9%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "0 0% 98%",
        border: "0 0% 89.8%",
        input: "0 0% 89.8%",
        ring: "0 0% 3.9%",
      },
      dark: {
        background: "0 0% 3.9%",
        foreground: "0 0% 98%",
        card: "0 0% 3.9%",
        "card-foreground": "0 0% 98%",
        popover: "0 0% 3.9%",
        "popover-foreground": "0 0% 98%",
        primary: "0 0% 98%",
        "primary-foreground": "0 0% 9%",
        secondary: "0 0% 14.9%",
        "secondary-foreground": "0 0% 98%",
        muted: "0 0% 14.9%",
        "muted-foreground": "0 0% 63.9%",
        accent: "0 0% 14.9%",
        "accent-foreground": "0 0% 98%",
        destructive: "0 70.9% 59.4%",
        "destructive-foreground": "0 0% 98%",
        border: "0 0% 14.9%",
        input: "0 0% 14.9%",
        ring: "0 0% 83.1%",
      },
    },
    oklch: {
      light: {
        background: "oklch(1 0 0)",
        foreground: "oklch(0.145 0 0)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.145 0 0)",
        popover: "oklch(1 0 0)",
        "popover-foreground": "oklch(0.145 0 0)",
        primary: "oklch(0.205 0 0)",
        "primary-foreground": "oklch(0.985 0 0)",
        secondary: "oklch(0.97 0 0)",
        "secondary-foreground": "oklch(0.205 0 0)",
        muted: "oklch(0.97 0 0)",
        "muted-foreground": "oklch(0.556 0 0)",
        accent: "oklch(0.97 0 0)",
        "accent-foreground": "oklch(0.205 0 0)",
        destructive: "oklch(0.577 0.245 27.325)",
        "destructive-foreground": "oklch(0.97 0 0)",
        border: "oklch(0.922 0 0)",
        input: "oklch(0.922 0 0)",
        ring: "oklch(0.205 0 0)",
      },
      dark: {
        background: "oklch(0.145 0 0)",
        foreground: "oklch(0.985 0 0)",
        card: "oklch(0.145 0 0)",
        "card-foreground": "oklch(0.985 0 0)",
        popover: "oklch(0.145 0 0)",
        "popover-foreground": "oklch(0.985 0 0)",
        primary: "oklch(0.985 0 0)",
        "primary-foreground": "oklch(0.205 0 0)",
        secondary: "oklch(0.269 0 0)",
        "secondary-foreground": "oklch(0.985 0 0)",
        muted: "oklch(0.269 0 0)",
        "muted-foreground": "oklch(0.708 0 0)",
        accent: "oklch(0.269 0 0)",
        "accent-foreground": "oklch(0.985 0 0)",
        destructive: "oklch(0.396 0.141 25.723)",
        "destructive-foreground": "oklch(0.985 0 0)",
        border: "oklch(0.269 0 0)",
        input: "oklch(0.269 0 0)",
        ring: "oklch(0.87 0 0)",
      },
    },
  },
  slate: {
    hsl: {
      light: {
        background: "0 0% 100%",
        foreground: "222.2 84% 4.9%",
        card: "0 0% 100%",
        "card-foreground": "222.2 84% 4.9%",
        popover: "0 0% 100%",
        "popover-foreground": "222.2 84% 4.9%",
        primary: "222.2 47.4% 11.2%",
        "primary-foreground": "210 40% 98%",
        secondary: "210 40% 96.1%",
        "secondary-foreground": "222.2 47.4% 11.2%",
        muted: "210 40% 96.1%",
        "muted-foreground": "215.4 16.3% 46.9%",
        accent: "210 40% 96.1%",
        "accent-foreground": "222.2 47.4% 11.2%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "210 40% 98%",
        border: "214.3 31.8% 91.4%",
        input: "214.3 31.8% 91.4%",
        ring: "222.2 84% 4.9%",
      },
      dark: {
        background: "222.2 84% 4.9%",
        foreground: "210 40% 98%",
        card: "222.2 84% 4.9%",
        "card-foreground": "210 40% 98%",
        popover: "222.2 84% 4.9%",
        "popover-foreground": "210 40% 98%",
        primary: "210 40% 98%",
        "primary-foreground": "222.2 47.4% 11.2%",
        secondary: "217.2 32.6% 17.5%",
        "secondary-foreground": "210 40% 98%",
        muted: "217.2 32.6% 17.5%",
        "muted-foreground": "215 20.2% 65.1%",
        accent: "217.2 32.6% 17.5%",
        "accent-foreground": "210 40% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "210 40% 98%",
        border: "217.2 32.6% 17.5%",
        input: "217.2 32.6% 17.5%",
        ring: "224.3 76.3% 48%",
      },
    },
    oklch: {
      light: {
        background: "oklch(1 0 0)",
        foreground: "oklch(0.129 0.042 264.695)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.129 0.042 264.695)",
        popover: "oklch(1 0 0)",
        "popover-foreground": "oklch(0.129 0.042 264.695)",
        primary: "oklch(0.208 0.042 265.755)",
        "primary-foreground": "oklch(0.968 0.007 247.896)",
        secondary: "oklch(0.968 0.007 247.896)",
        "secondary-foreground": "oklch(0.208 0.042 265.755)",
        muted: "oklch(0.968 0.007 247.896)",
        "muted-foreground": "oklch(0.554 0.046 257.417)",
        accent: "oklch(0.968 0.007 247.896)",
        "accent-foreground": "oklch(0.208 0.042 265.755)",
        destructive: "oklch(0.577 0.245 27.325)",
        "destructive-foreground": "oklch(0.968 0.007 247.896)",
        border: "oklch(0.929 0.013 255.508)",
        input: "oklch(0.929 0.013 255.508)",
        ring: "oklch(0.129 0.042 264.695)",
      },
      dark: {
        background: "oklch(0.129 0.042 264.695)",
        foreground: "oklch(0.968 0.007 247.896)",
        card: "oklch(0.129 0.042 264.695)",
        "card-foreground": "oklch(0.968 0.007 247.896)",
        popover: "oklch(0.129 0.042 264.695)",
        "popover-foreground": "oklch(0.968 0.007 247.896)",
        primary: "oklch(0.968 0.007 247.896)",
        "primary-foreground": "oklch(0.208 0.042 265.755)",
        secondary: "oklch(0.279 0.041 260.031)",
        "secondary-foreground": "oklch(0.968 0.007 247.896)",
        muted: "oklch(0.279 0.041 260.031)",
        "muted-foreground": "oklch(0.704 0.04 256.788)",
        accent: "oklch(0.279 0.041 260.031)",
        "accent-foreground": "oklch(0.968 0.007 247.896)",
        destructive: "oklch(0.396 0.141 25.723)",
        "destructive-foreground": "oklch(0.968 0.007 247.896)",
        border: "oklch(0.279 0.041 260.031)",
        input: "oklch(0.279 0.041 260.031)",
        ring: "oklch(0.87 0 0)",
      },
    },
  },
  stone: {
    hsl: {
      light: {
        background: "0 0% 100%",
        foreground: "24 9.8% 10%",
        card: "0 0% 100%",
        "card-foreground": "24 9.8% 10%",
        popover: "0 0% 100%",
        "popover-foreground": "24 9.8% 10%",
        primary: "24 9.8% 10%",
        "primary-foreground": "60 9.1% 97.8%",
        secondary: "60 4.8% 95.9%",
        "secondary-foreground": "24 9.8% 10%",
        muted: "60 4.8% 95.9%",
        "muted-foreground": "25 5.3% 44.7%",
        accent: "60 4.8% 95.9%",
        "accent-foreground": "24 9.8% 10%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "60 9.1% 97.8%",
        border: "20 5.9% 90%",
        input: "20 5.9% 90%",
        ring: "24 9.8% 10%",
      },
      dark: {
        background: "24 9.8% 10%",
        foreground: "60 9.1% 97.8%",
        card: "24 9.8% 10%",
        "card-foreground": "60 9.1% 97.8%",
        popover: "24 9.8% 10%",
        "popover-foreground": "60 9.1% 97.8%",
        primary: "60 9.1% 97.8%",
        "primary-foreground": "24 9.8% 10%",
        secondary: "12 6.5% 15.1%",
        "secondary-foreground": "60 9.1% 97.8%",
        muted: "12 6.5% 15.1%",
        "muted-foreground": "24 5.4% 63.9%",
        accent: "12 6.5% 15.1%",
        "accent-foreground": "60 9.1% 97.8%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "60 9.1% 97.8%",
        border: "12 6.5% 15.1%",
        input: "12 6.5% 15.1%",
        ring: "24 9.8% 10%",
      },
    },
    oklch: {
      light: {
        background: "oklch(1 0 0)",
        foreground: "oklch(0.147 0.004 49.25)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.147 0.004 49.25)",
        popover: "oklch(1 0 0)",
        "popover-foreground": "oklch(0.147 0.004 49.25)",
        primary: "oklch(0.216 0.006 56.043)",
        "primary-foreground": "oklch(0.97 0.001 106.424)",
        secondary: "oklch(0.97 0.001 106.424)",
        "secondary-foreground": "oklch(0.216 0.006 56.043)",
        muted: "oklch(0.97 0.001 106.424)",
        "muted-foreground": "oklch(0.553 0.013 58.071)",
        accent: "oklch(0.97 0.001 106.424)",
        "accent-foreground": "oklch(0.216 0.006 56.043)",
        destructive: "oklch(0.577 0.245 27.325)",
        "destructive-foreground": "oklch(0.97 0.001 106.424)",
        border: "oklch(0.923 0.003 48.717)",
        input: "oklch(0.923 0.003 48.717)",
        ring: "oklch(0.216 0.006 56.043)",
      },
      dark: {
        background: "oklch(0.147 0.004 49.25)",
        foreground: "oklch(0.97 0.001 106.424)",
        card: "oklch(0.147 0.004 49.25)",
        "card-foreground": "oklch(0.97 0.001 106.424)",
        popover: "oklch(0.147 0.004 49.25)",
        "popover-foreground": "oklch(0.97 0.001 106.424)",
        primary: "oklch(0.97 0.001 106.424)",
        "primary-foreground": "oklch(0.216 0.006 56.043)",
        secondary: "oklch(0.268 0.007 34.298)",
        "secondary-foreground": "oklch(0.97 0.001 106.424)",
        muted: "oklch(0.268 0.007 34.298)",
        "muted-foreground": "oklch(0.709 0.01 56.259)",
        accent: "oklch(0.268 0.007 34.298)",
        "accent-foreground": "oklch(0.97 0.001 106.424)",
        destructive: "oklch(0.396 0.141 25.723)",
        "destructive-foreground": "oklch(0.97 0.001 106.424)",
        border: "oklch(0.268 0.007 34.298)",
        input: "oklch(0.268 0.007 34.298)",
        ring: "oklch(0.87 0 0)",
      },
    },
  },
  gray: {
    hsl: {
      light: {
        background: "0 0% 100%",
        foreground: "224 71.4% 4.1%",
        card: "0 0% 100%",
        "card-foreground": "224 71.4% 4.1%",
        popover: "0 0% 100%",
        "popover-foreground": "224 71.4% 4.1%",
        primary: "220 9% 18%",
        "primary-foreground": "220 14.3% 95.9%",
        secondary: "220 14.3% 95.9%",
        "secondary-foreground": "220 9% 18%",
        muted: "220 14.3% 95.9%",
        "muted-foreground": "220 8.9% 46.1%",
        accent: "220 14.3% 95.9%",
        "accent-foreground": "220 9% 18%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "220 14.3% 95.9%",
        border: "220 13% 91%",
        input: "220 13% 91%",
        ring: "224 71.4% 4.1%",
      },
      dark: {
        background: "224 71.4% 4.1%",
        foreground: "220 14.3% 95.9%",
        card: "224 71.4% 4.1%",
        "card-foreground": "220 14.3% 95.9%",
        popover: "224 71.4% 4.1%",
        "popover-foreground": "220 14.3% 95.9%",
        primary: "220 14.3% 95.9%",
        "primary-foreground": "220 9% 18%",
        secondary: "220 9% 18%",
        "secondary-foreground": "220 14.3% 95.9%",
        muted: "220 9% 18%",
        "muted-foreground": "220 10% 64.9%",
        accent: "220 9% 18%",
        "accent-foreground": "220 14.3% 95.9%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "220 14.3% 95.9%",
        border: "220 9% 18%",
        input: "220 9% 18%",
        ring: "220 14.3% 95.9%",
      },
    },
    oklch: {
      light: {
        background: "oklch(1 0 0)",
        foreground: "oklch(0.13 0.028 261.692)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.13 0.028 261.692)",
        popover: "oklch(1 0 0)",
        "popover-foreground": "oklch(0.13 0.028 261.692)",
        primary: "oklch(0.21 0.034 264.665)",
        "primary-foreground": "oklch(0.967 0.003 264.542)",
        secondary: "oklch(0.967 0.003 264.542)",
        "secondary-foreground": "oklch(0.21 0.034 264.665)",
        muted: "oklch(0.967 0.003 264.542)",
        "muted-foreground": "oklch(0.551 0.027 264.364)",
        accent: "oklch(0.967 0.003 264.542)",
        "accent-foreground": "oklch(0.21 0.034 264.665)",
        destructive: "oklch(0.577 0.245 27.325)",
        "destructive-foreground": "oklch(0.967 0.003 264.542)",
        border: "oklch(0.928 0.006 264.531)",
        input: "oklch(0.928 0.006 264.531)",
        ring: "oklch(0.13 0.028 261.692)",
      },
      dark: {
        background: "oklch(0.13 0.028 261.692)",
        foreground: "oklch(0.967 0.003 264.542)",
        card: "oklch(0.13 0.028 261.692)",
        "card-foreground": "oklch(0.967 0.003 264.542)",
        popover: "oklch(0.13 0.028 261.692)",
        "popover-foreground": "oklch(0.967 0.003 264.542)",
        primary: "oklch(0.967 0.003 264.542)",
        "primary-foreground": "oklch(0.21 0.034 264.665)",
        secondary: "oklch(0.278 0.033 256.848)",
        "secondary-foreground": "oklch(0.967 0.003 264.542)",
        muted: "oklch(0.278 0.033 256.848)",
        "muted-foreground": "oklch(0.707 0.022 261.325)",
        accent: "oklch(0.278 0.033 256.848)",
        "accent-foreground": "oklch(0.967 0.003 264.542)",
        destructive: "oklch(0.396 0.141 25.723)",
        "destructive-foreground": "oklch(0.967 0.003 264.542)",
        border: "oklch(0.278 0.033 256.848)",
        input: "oklch(0.278 0.033 256.848)",
        ring: "oklch(0.87 0 0)",
      },
    },
  },
  taupe: {
    hsl: {
      light: {
        background: "30 20% 98%",
        foreground: "30 10% 5%",
        card: "30 20% 98%",
        "card-foreground": "30 10% 5%",
        popover: "30 20% 98%",
        "popover-foreground": "30 10% 5%",
        primary: "30 10% 12%",
        "primary-foreground": "30 20% 98%",
        secondary: "30 10% 92%",
        "secondary-foreground": "30 10% 12%",
        muted: "30 10% 92%",
        "muted-foreground": "30 5% 45%",
        accent: "30 10% 92%",
        "accent-foreground": "30 10% 12%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "0 0% 98%",
        border: "30 10% 88%",
        input: "30 10% 88%",
        ring: "30 10% 12%",
      },
      dark: {
        background: "30 10% 5%",
        foreground: "30 20% 98%",
        card: "30 10% 5%",
        "card-foreground": "30 20% 98%",
        popover: "30 10% 5%",
        "popover-foreground": "30 20% 98%",
        primary: "30 20% 98%",
        "primary-foreground": "30 10% 12%",
        secondary: "30 10% 18%",
        "secondary-foreground": "30 20% 98%",
        muted: "30 10% 18%",
        "muted-foreground": "30 5% 65%",
        accent: "30 10% 18%",
        "accent-foreground": "30 20% 98%",
        destructive: "0 70.9% 59.4%",
        "destructive-foreground": "30 20% 98%",
        border: "30 10% 18%",
        input: "30 10% 18%",
        ring: "30 10% 84%",
      },
    },
    oklch: {
      light: {
        background: "oklch(0.986 0.002 67.8)",
        foreground: "oklch(0.147 0.004 49.3)",
        card: "oklch(0.986 0.002 67.8)",
        "card-foreground": "oklch(0.147 0.004 49.3)",
        popover: "oklch(0.986 0.002 67.8)",
        "popover-foreground": "oklch(0.147 0.004 49.3)",
        primary: "oklch(0.214 0.009 43.1)",
        "primary-foreground": "oklch(0.986 0.002 67.8)",
        secondary: "oklch(0.922 0.005 34.3)",
        "secondary-foreground": "oklch(0.214 0.009 43.1)",
        muted: "oklch(0.922 0.005 34.3)",
        "muted-foreground": "oklch(0.547 0.021 43.1)",
        accent: "oklch(0.922 0.005 34.3)",
        "accent-foreground": "oklch(0.214 0.009 43.1)",
        destructive: "oklch(0.577 0.245 27.325)",
        "destructive-foreground": "oklch(0.97 0 0)",
        border: "oklch(0.868 0.007 39.5)",
        input: "oklch(0.868 0.007 39.5)",
        ring: "oklch(0.214 0.009 43.1)",
      },
      dark: {
        background: "oklch(0.147 0.004 49.3)",
        foreground: "oklch(0.986 0.002 67.8)",
        card: "oklch(0.147 0.004 49.3)",
        "card-foreground": "oklch(0.986 0.002 67.8)",
        popover: "oklch(0.147 0.004 49.3)",
        "popover-foreground": "oklch(0.986 0.002 67.8)",
        primary: "oklch(0.986 0.002 67.8)",
        "primary-foreground": "oklch(0.214 0.009 43.1)",
        secondary: "oklch(0.268 0.011 36.5)",
        "secondary-foreground": "oklch(0.986 0.002 67.8)",
        muted: "oklch(0.268 0.011 36.5)",
        "muted-foreground": "oklch(0.714 0.014 41.2)",
        accent: "oklch(0.268 0.011 36.5)",
        "accent-foreground": "oklch(0.986 0.002 67.8)",
        destructive: "oklch(0.396 0.141 25.723)",
        "destructive-foreground": "oklch(0.986 0.002 67.8)",
        border: "oklch(0.268 0.011 36.5)",
        input: "oklch(0.268 0.011 36.5)",
        ring: "oklch(0.868 0.007 39.5)",
      },
    },
  },
  mauve: {
    hsl: {
      light: {
        background: "0 0% 100%",
        foreground: "326 5% 5%",
        card: "0 0% 100%",
        "card-foreground": "326 5% 5%",
        popover: "0 0% 100%",
        "popover-foreground": "326 5% 5%",
        primary: "322 10% 13%",
        "primary-foreground": "0 0% 98%",
        secondary: "325 5% 95%",
        "secondary-foreground": "322 10% 13%",
        muted: "325 5% 95%",
        "muted-foreground": "322 8% 45%",
        accent: "325 5% 95%",
        "accent-foreground": "322 10% 13%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "0 0% 98%",
        border: "325 5% 91%",
        input: "325 5% 91%",
        ring: "322 10% 13%",
      },
      dark: {
        background: "326 5% 5%",
        foreground: "0 0% 98%",
        card: "322 10% 13%",
        "card-foreground": "0 0% 98%",
        popover: "322 10% 13%",
        "popover-foreground": "0 0% 98%",
        primary: "325 5% 91%",
        "primary-foreground": "322 10% 13%",
        secondary: "320 6% 17%",
        "secondary-foreground": "0 0% 98%",
        muted: "320 6% 17%",
        "muted-foreground": "323 6% 65%",
        accent: "320 6% 17%",
        "accent-foreground": "0 0% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "0 0% 98%",
        border: "320 6% 17%",
        input: "320 6% 17%",
        ring: "322 8% 45%",
      },
    },
    oklch: {
      light: {
        background: "oklch(1 0 0)",
        foreground: "oklch(0.145 0.008 326)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.145 0.008 326)",
        popover: "oklch(1 0 0)",
        "popover-foreground": "oklch(0.145 0.008 326)",
        primary: "oklch(0.212 0.019 322.12)",
        "primary-foreground": "oklch(0.985 0 0)",
        secondary: "oklch(0.96 0.003 325.6)",
        "secondary-foreground": "oklch(0.212 0.019 322.12)",
        muted: "oklch(0.96 0.003 325.6)",
        "muted-foreground": "oklch(0.542 0.034 322.5)",
        accent: "oklch(0.96 0.003 325.6)",
        "accent-foreground": "oklch(0.212 0.019 322.12)",
        destructive: "oklch(0.577 0.245 27.325)",
        "destructive-foreground": "oklch(0.985 0 0)",
        border: "oklch(0.922 0.005 325.62)",
        input: "oklch(0.922 0.005 325.62)",
        ring: "oklch(0.711 0.019 323.02)",
      },
      dark: {
        background: "oklch(0.145 0.008 326)",
        foreground: "oklch(0.985 0 0)",
        card: "oklch(0.212 0.019 322.12)",
        "card-foreground": "oklch(0.985 0 0)",
        popover: "oklch(0.212 0.019 322.12)",
        "popover-foreground": "oklch(0.985 0 0)",
        primary: "oklch(0.922 0.005 325.62)",
        "primary-foreground": "oklch(0.212 0.019 322.12)",
        secondary: "oklch(0.263 0.024 320.12)",
        "secondary-foreground": "oklch(0.985 0 0)",
        muted: "oklch(0.263 0.024 320.12)",
        "muted-foreground": "oklch(0.711 0.019 323.02)",
        accent: "oklch(0.263 0.024 320.12)",
        "accent-foreground": "oklch(0.985 0 0)",
        destructive: "oklch(0.704 0.191 22.216)",
        "destructive-foreground": "oklch(0.985 0 0)",
        border: "oklch(0.263 0.024 320.12)",
        input: "oklch(0.263 0.024 320.12)",
        ring: "oklch(0.542 0.034 322.5)",
      },
    },
  },
  olive: {
    hsl: {
      light: {
        background: "0 0% 100%",
        foreground: "107 3% 5%",
        card: "0 0% 100%",
        "card-foreground": "107 3% 5%",
        popover: "0 0% 100%",
        "popover-foreground": "107 3% 5%",
        primary: "107 6% 13%",
        "primary-foreground": "107 4% 98%",
        secondary: "107 4% 95%",
        "secondary-foreground": "107 6% 13%",
        muted: "107 4% 95%",
        "muted-foreground": "107 9% 45%",
        accent: "107 4% 95%",
        "accent-foreground": "107 6% 13%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "107 4% 98%",
        border: "107 5% 91%",
        input: "107 5% 91%",
        ring: "107 6% 13%",
      },
      dark: {
        background: "107 3% 5%",
        foreground: "107 4% 98%",
        card: "107 6% 13%",
        "card-foreground": "107 4% 98%",
        popover: "107 6% 13%",
        "popover-foreground": "107 4% 98%",
        primary: "107 5% 91%",
        "primary-foreground": "107 6% 13%",
        secondary: "107 4% 17%",
        "secondary-foreground": "107 4% 98%",
        muted: "107 4% 17%",
        "muted-foreground": "107 6% 65%",
        accent: "107 4% 17%",
        "accent-foreground": "107 4% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "107 4% 98%",
        border: "107 4% 17%",
        input: "107 4% 17%",
        ring: "107 9% 45%",
      },
    },
    oklch: {
      light: {
        background: "oklch(1 0 0)",
        foreground: "oklch(0.153 0.006 107.1)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.153 0.006 107.1)",
        popover: "oklch(1 0 0)",
        "popover-foreground": "oklch(0.153 0.006 107.1)",
        primary: "oklch(0.228 0.013 107.4)",
        "primary-foreground": "oklch(0.988 0.003 106.5)",
        secondary: "oklch(0.966 0.005 106.5)",
        "secondary-foreground": "oklch(0.228 0.013 107.4)",
        muted: "oklch(0.966 0.005 106.5)",
        "muted-foreground": "oklch(0.58 0.031 107.3)",
        accent: "oklch(0.966 0.005 106.5)",
        "accent-foreground": "oklch(0.228 0.013 107.4)",
        destructive: "oklch(0.577 0.245 27.325)",
        "destructive-foreground": "oklch(0.988 0.003 106.5)",
        border: "oklch(0.93 0.007 106.5)",
        input: "oklch(0.93 0.007 106.5)",
        ring: "oklch(0.737 0.021 106.9)",
      },
      dark: {
        background: "oklch(0.153 0.006 107.1)",
        foreground: "oklch(0.988 0.003 106.5)",
        card: "oklch(0.228 0.013 107.4)",
        "card-foreground": "oklch(0.988 0.003 106.5)",
        popover: "oklch(0.228 0.013 107.4)",
        "popover-foreground": "oklch(0.988 0.003 106.5)",
        primary: "oklch(0.93 0.007 106.5)",
        "primary-foreground": "oklch(0.228 0.013 107.4)",
        secondary: "oklch(0.286 0.016 107.4)",
        "secondary-foreground": "oklch(0.988 0.003 106.5)",
        muted: "oklch(0.286 0.016 107.4)",
        "muted-foreground": "oklch(0.737 0.021 106.9)",
        accent: "oklch(0.286 0.016 107.4)",
        "accent-foreground": "oklch(0.988 0.003 106.5)",
        destructive: "oklch(0.704 0.191 22.216)",
        "destructive-foreground": "oklch(0.988 0.003 106.5)",
        border: "oklch(0.286 0.016 107.4)",
        input: "oklch(0.286 0.016 107.4)",
        ring: "oklch(0.58 0.031 107.3)",
      },
    },
  },
  mist: {
    hsl: {
      light: {
        background: "0 0% 100%",
        foreground: "228 4% 5%",
        card: "0 0% 100%",
        "card-foreground": "228 4% 5%",
        popover: "0 0% 100%",
        "popover-foreground": "228 4% 5%",
        primary: "223 6% 13%",
        "primary-foreground": "197 2% 98%",
        secondary: "197 2% 95%",
        "secondary-foreground": "223 6% 13%",
        muted: "197 2% 95%",
        "muted-foreground": "213 7% 45%",
        accent: "197 2% 95%",
        "accent-foreground": "223 6% 13%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "197 2% 98%",
        border: "214 5% 91%",
        input: "214 5% 91%",
        ring: "223 6% 13%",
      },
      dark: {
        background: "228 4% 5%",
        foreground: "197 2% 98%",
        card: "223 6% 13%",
        "card-foreground": "197 2% 98%",
        popover: "223 6% 13%",
        "popover-foreground": "197 2% 98%",
        primary: "214 5% 91%",
        "primary-foreground": "223 6% 13%",
        secondary: "216 4% 17%",
        "secondary-foreground": "197 2% 98%",
        muted: "216 4% 17%",
        "muted-foreground": "214 6% 65%",
        accent: "216 4% 17%",
        "accent-foreground": "197 2% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "197 2% 98%",
        border: "216 4% 17%",
        input: "216 4% 17%",
        ring: "213 7% 45%",
      },
    },
    oklch: {
      light: {
        background: "oklch(1 0 0)",
        foreground: "oklch(0.148 0.004 228.8)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.148 0.004 228.8)",
        popover: "oklch(1 0 0)",
        "popover-foreground": "oklch(0.148 0.004 228.8)",
        primary: "oklch(0.218 0.008 223.9)",
        "primary-foreground": "oklch(0.987 0.002 197.1)",
        secondary: "oklch(0.963 0.002 197.1)",
        "secondary-foreground": "oklch(0.218 0.008 223.9)",
        muted: "oklch(0.963 0.002 197.1)",
        "muted-foreground": "oklch(0.56 0.021 213.5)",
        accent: "oklch(0.963 0.002 197.1)",
        "accent-foreground": "oklch(0.218 0.008 223.9)",
        destructive: "oklch(0.577 0.245 27.325)",
        "destructive-foreground": "oklch(0.987 0.002 197.1)",
        border: "oklch(0.925 0.005 214.3)",
        input: "oklch(0.925 0.005 214.3)",
        ring: "oklch(0.723 0.014 214.4)",
      },
      dark: {
        background: "oklch(0.148 0.004 228.8)",
        foreground: "oklch(0.987 0.002 197.1)",
        card: "oklch(0.218 0.008 223.9)",
        "card-foreground": "oklch(0.987 0.002 197.1)",
        popover: "oklch(0.218 0.008 223.9)",
        "popover-foreground": "oklch(0.987 0.002 197.1)",
        primary: "oklch(0.925 0.005 214.3)",
        "primary-foreground": "oklch(0.218 0.008 223.9)",
        secondary: "oklch(0.275 0.011 216.9)",
        "secondary-foreground": "oklch(0.987 0.002 197.1)",
        muted: "oklch(0.275 0.011 216.9)",
        "muted-foreground": "oklch(0.723 0.014 214.4)",
        accent: "oklch(0.275 0.011 216.9)",
        "accent-foreground": "oklch(0.987 0.002 197.1)",
        destructive: "oklch(0.704 0.191 22.216)",
        "destructive-foreground": "oklch(0.987 0.002 197.1)",
        border: "oklch(0.275 0.011 216.9)",
        input: "oklch(0.275 0.011 216.9)",
        ring: "oklch(0.56 0.021 213.5)",
      },
    },
  },
};

type StyleConfig = {
  radius: string;
  fontSans: string;
  defaultBaseColor: "zinc" | "slate" | "stone" | "gray" | "neutral" | "taupe" | "mauve" | "olive" | "mist";
};

const STYLE_CONFIGS: Record<string, StyleConfig> = {
  "default": {
    radius: "0.5rem",
    fontSans: "Inter",
    defaultBaseColor: "slate",
  },
  "new-york": {
    radius: "0.5rem",
    fontSans: "Inter",
    defaultBaseColor: "zinc",
  },
  luma: {
    radius: "0.75rem",
    fontSans: "Inter",
    defaultBaseColor: "neutral",
  },
  lyra: {
    radius: "0.125rem",
    fontSans: "JetBrains Mono",
    defaultBaseColor: "stone",
  },
  maia: {
    radius: "1rem",
    fontSans: "Inter",
    defaultBaseColor: "neutral",
  },
  mira: {
    radius: "9999px",
    fontSans: "Inter",
    defaultBaseColor: "zinc",
  },
  nova: {
    radius: "0.125rem",
    fontSans: "Inter",
    defaultBaseColor: "neutral",
  },
  rhea: {
    radius: "9999px",
    fontSans: "Inter",
    defaultBaseColor: "neutral",
  },
  sera: {
    radius: "0rem",
    fontSans: "Instrument Serif",
    defaultBaseColor: "taupe",
  },
  vega: {
    radius: "0.625rem",
    fontSans: "Inter",
    defaultBaseColor: "neutral",
  },
};

function getStyleVars(style: string, styleEngine: "nativewind" | "uniwind", baseColor: string, theme?: string, chartColor?: string): string {
  const styleConfig: StyleConfig = STYLE_CONFIGS[style] ?? STYLE_CONFIGS["new-york"]!;

  let resolvedColor: "zinc" | "slate" | "stone" | "gray" | "neutral" | "taupe" | "mauve" | "olive" | "mist" = "zinc";
  if (baseColor in THEME_COLORS) {
    resolvedColor = baseColor as any;
  } else {
    resolvedColor = styleConfig.defaultBaseColor;
  }

  const colorConfig = THEME_COLORS[resolvedColor];
  const radius = styleConfig.radius;

  // Resolve theme (accent primary override) and chart color ramp.
  const cssFormat: "oklch" | "hsl" = styleEngine === "uniwind" ? "oklch" : "hsl";
  const themePrimary = theme ? getThemePrimary(theme, cssFormat) : null;
  const chartRamp = getChartRamp(chartColor ?? theme ?? "blue", cssFormat);

  const fontVariables = `:root {
  --font-sans: ${styleConfig.fontSans}, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji,
    Segoe UI Symbol, Noto Color Emoji;
  --font-display:
    Spline Sans, Inter, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji,
    Segoe UI Symbol, Noto Color Emoji;
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
  --font-rounded: 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif;
  --font-serif: Georgia, 'Times New Roman', serif;
}
`;

  if (styleEngine === "uniwind") {
    let lightVars = "";
    for (const [key, val] of Object.entries(colorConfig.oklch.light)) {
      // Apply theme primary override
      if (themePrimary && key === "primary") { lightVars += `  --primary: ${themePrimary.light.primary};\n`; continue; }
      if (themePrimary && key === "primary-foreground") { lightVars += `  --primary-foreground: ${themePrimary.light.foreground};\n`; continue; }
      lightVars += `  --${key}: ${val};\n`;
    }
    // Chart colors (light)
    chartRamp.light.forEach((c, i) => { lightVars += `  --chart-${i + 1}: ${c};\n`; });

    let darkVars = "";
    for (const [key, val] of Object.entries(colorConfig.oklch.dark)) {
      if (themePrimary && key === "primary") { darkVars += `  --primary: ${themePrimary.dark.primary};\n`; continue; }
      if (themePrimary && key === "primary-foreground") { darkVars += `  --primary-foreground: ${themePrimary.dark.foreground};\n`; continue; }
      darkVars += `  --${key}: ${val};\n`;
    }
    chartRamp.dark.forEach((c, i) => { darkVars += `  --chart-${i + 1}: ${c};\n`; });

    return `@theme inline {
  --radius: ${radius};
  --radius-xl: calc(var(--radius) + 4px);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 16px);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
}

:root {
${lightVars}}

.dark {
${darkVars}}

${fontVariables}`;
  } else {
    let lightVars = "";
    for (const [key, val] of Object.entries(colorConfig.hsl.light)) {
      if (themePrimary && key === "primary") { lightVars += `    --primary: ${themePrimary.light.primary};\n`; continue; }
      if (themePrimary && key === "primary-foreground") { lightVars += `    --primary-foreground: ${themePrimary.light.foreground};\n`; continue; }
      lightVars += `    --${key}: ${val};\n`;
    }
    chartRamp.light.forEach((c, i) => { lightVars += `    --chart-${i + 1}: ${c};\n`; });

    let darkVars = "";
    for (const [key, val] of Object.entries(colorConfig.hsl.dark)) {
      if (themePrimary && key === "primary") { darkVars += `    --primary: ${themePrimary.dark.primary};\n`; continue; }
      if (themePrimary && key === "primary-foreground") { darkVars += `    --primary-foreground: ${themePrimary.dark.foreground};\n`; continue; }
      darkVars += `    --${key}: ${val};\n`;
    }
    chartRamp.dark.forEach((c, i) => { darkVars += `    --chart-${i + 1}: ${c};\n`; });

    return `@layer base {
  :root {
    --radius: ${radius};
${lightVars}  }

  .dark:root {
${darkVars}  }
}

${fontVariables}`;
  }
}

async function configureGlobalCss(projectPath: string, styleEngine: "nativewind" | "uniwind", cssRelativePath: string, style: string, baseColor: string, theme?: string, chartColor?: string) {
  const cssPath = path.join(projectPath, cssRelativePath)
  fs.ensureDirSync(path.dirname(cssPath))

  let content = ""
  if (styleEngine === "uniwind") {
    content += '@import "tailwindcss";\n'
    content += '@import "uniwind";\n'
  } else {
    content += '@tailwind base;\n'
    content += '@tailwind components;\n'
    content += '@tailwind utilities;\n'
  }

  content += "\n" + getStyleVars(style, styleEngine, baseColor, theme, chartColor) + "\n"

  fs.writeFileSync(cssPath, content, "utf8")
  console.log(pc.green(`✔ Configured global CSS for style ${pc.cyan(style)}`))
}

// Exported for the `preset apply` command to regenerate global.css with full
// color + theme + chart generation (reuses the same pipeline as init).
export async function regenerateProjectCss(opts: {
  projectPath: string
  styleEngine: "nativewind" | "uniwind"
  cssRelativePath: string
  style: string
  baseColor: string
  theme?: string
  chartColor?: string
}) {
  await configureGlobalCss(
    opts.projectPath,
    opts.styleEngine,
    opts.cssRelativePath,
    opts.style,
    opts.baseColor,
    opts.theme,
    opts.chartColor
  )
}

function getRegistryUrl(): string {
  if (process.env.LOVDA_REGISTRY_URL) {
    return process.env.LOVDA_REGISTRY_URL
  }

  // Try to find local registry in workspace
  const possibleLocalPaths = [
    path.resolve(__dirname, "../test/fixtures/registry"),
    path.resolve(__dirname, "../../test/fixtures/registry"),
    path.resolve(__dirname, "../../../test/fixtures/registry"),
    path.resolve(__dirname, "../../../../test/fixtures/registry"),
    path.resolve(__dirname, "../../../../../test/fixtures/registry"),
  ]

  for (const localPath of possibleLocalPaths) {
    if (fs.existsSync(localPath)) {
      return localPath
    }
  }

  return REGISTRY_URL
}

function configureMetroConfig(projectPath: string, styleEngine: "nativewind" | "uniwind", cssRelativePath: string, hasSrcDir: boolean) {
  const filenames = ["metro.config.js", "metro.config.ts", "metro.config.cjs", "metro.config.mjs"]
  let foundFile: string | null = null
  for (const name of filenames) {
    if (fs.existsSync(path.join(projectPath, name))) {
      foundFile = name
      break
    }
  }

  if (!foundFile) {
    // Create default
    const targetPath = path.join(projectPath, "metro.config.js")
    let content = ""
    if (styleEngine === "uniwind") {
      content = `const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: '${cssRelativePath}',
  dtsFile: '${hasSrcDir ? "./src/uniwind-types.d.ts" : "./uniwind-types.d.ts"}'
});
`
    } else {
      content = `const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: '${cssRelativePath}' });
`
    }
    fs.writeFileSync(targetPath, content, "utf8")
    console.log(pc.green(`✔ Created ${pc.cyan("metro.config.js")}`))
  } else {
    // Modify existing
    const targetPath = path.join(projectPath, foundFile)
    let content = fs.readFileSync(targetPath, "utf8")

    if (styleEngine === "uniwind" && !content.includes("withUniwindConfig")) {
      // Prepend import
      content = `const { withUniwindConfig } = require('uniwind/metro');\n` + content
      // Wrap export
      if (content.includes("module.exports = ")) {
        content = content.replace(
          /module\.exports\s*=\s*(.+?)(;?\s*$)/s,
          `module.exports = withUniwindConfig($1, {
  cssEntryFile: '${cssRelativePath}',
  dtsFile: '${hasSrcDir ? "./src/uniwind-types.d.ts" : "./uniwind-types.d.ts"}'
})$2`
        )
      }
      fs.writeFileSync(targetPath, content, "utf8")
      console.log(pc.green(`✔ Updated ${pc.cyan(foundFile)}`))
    } else if (styleEngine === "nativewind" && !content.includes("withNativeWind")) {
      // Prepend import
      content = `const { withNativeWind } = require('nativewind/metro');\n` + content
      // Wrap export
      if (content.includes("module.exports = ")) {
        content = content.replace(
          /module\.exports\s*=\s*(.+?)(;?\s*$)/s,
          `module.exports = withNativeWind($1, { input: '${cssRelativePath}' })$2`
        )
      }
      fs.writeFileSync(targetPath, content, "utf8")
      console.log(pc.green(`✔ Updated ${pc.cyan(foundFile)}`))
    }
  }
}

function configureTailwindConfig(projectPath: string, templateTailwindPath: string) {
  const filenames = [
    "tailwind.config.js",
    "tailwind.config.ts",
    "tailwind.config.cjs",
    "tailwind.config.mjs",
  ]
  let foundFile: string | null = null
  for (const name of filenames) {
    if (fs.existsSync(path.join(projectPath, name))) {
      foundFile = name
      break
    }
  }

  if (!foundFile) {
    if (fs.existsSync(templateTailwindPath)) {
      const targetPath = path.join(projectPath, "tailwind.config.js")
      fs.copySync(templateTailwindPath, targetPath)
      console.log(pc.green(`✔ Created ${pc.cyan("tailwind.config.js")}`))
    }
    return
  }

  const targetPath = path.join(projectPath, foundFile)
  let content = fs.readFileSync(targetPath, "utf8")
  const original = content
  const patches: string[] = []

  const hasNativewindThemeImport = /require\(\s*["']nativewind\/theme["']\s*\)/.test(content)
  const hasHairlineWidthDecl = /\bhairlineWidth\b/.test(content)

  if (!hasNativewindThemeImport) {
    content = `const { hairlineWidth } = require("nativewind/theme");\n` + content
    patches.push("nativewind/theme import")
  } else if (!hasHairlineWidthDecl) {
    // The require exists but doesn't destructure hairlineWidth; leave alone to avoid breakage.
  }

  if (!/darkMode\s*:/.test(content)) {
    content = content.replace(
      /module\.exports\s*=\s*\{/,
      `module.exports = {\n  darkMode: "class",`
    )
    patches.push("darkMode")
  }

  // Ensure theme.extend exists with the semantic color mapping.
  const needsColors = !/colors\s*:\s*\{[^}]*hsl\(var\(--background\)\)/s.test(content)
  const needsBorderRadius =
    !/borderRadius\s*:\s*\{[^}]*var\(--radius\)/s.test(content)
  const needsAccordionKeyframes = !/["']accordion-down["']\s*:/.test(content)

  if (needsColors || needsBorderRadius || needsAccordionKeyframes) {
    const extendBlock = buildTailwindExtendBlock({
      includeColors: needsColors,
      includeBorderRadius: needsBorderRadius,
      includeBorderWidth: !hasHairlineWidthDecl ? false : !/borderWidth\s*:/.test(content),
      includeKeyframes: needsAccordionKeyframes,
    })

    if (/theme\s*:\s*\{\s*extend\s*:\s*\{\s*\}/.test(content)) {
      // Empty extend: replace with our block
      content = content.replace(
        /theme\s*:\s*\{\s*extend\s*:\s*\{\s*\}\s*,?\s*\}/,
        `theme: {\n    extend: ${extendBlock}\n  }`
      )
    } else if (/theme\s*:\s*\{\s*extend\s*:\s*\{/.test(content)) {
      // Non-empty extend: inject entries after the opening brace
      content = content.replace(
        /theme\s*:\s*\{\s*extend\s*:\s*\{/,
        (match) => `${match}\n      ...${extendBlock},`
      )
    } else if (/theme\s*:\s*\{/.test(content)) {
      // Has theme but no extend
      content = content.replace(
        /theme\s*:\s*\{/,
        `theme: {\n    extend: ${extendBlock},`
      )
    } else {
      // No theme at all
      content = content.replace(
        /module\.exports\s*=\s*\{/,
        `module.exports = {\n  theme: {\n    extend: ${extendBlock},\n  },`
      )
    }
    patches.push("theme.extend (colors/borderRadius/keyframes)")
  }

  // Ensure chart colors exist in the colors block (for configs that already
  // had a colors block but predate chart-color support).
  if (!/["']?chart-1["']?\s*:/.test(content)) {
    // Inject the 5 chart entries right after the card color mapping.
    const chartLines = `        "chart-1": "hsl(var(--chart-1))",
        "chart-2": "hsl(var(--chart-2))",
        "chart-3": "hsl(var(--chart-3))",
        "chart-4": "hsl(var(--chart-4))",
        "chart-5": "hsl(var(--chart-5))",`
    if (/card:\s*\{[^}]*hsl\(var\(--card-foreground\)\)[^}]*\},/s.test(content)) {
      content = content.replace(
        /(card:\s*\{[^}]*hsl\(var\(--card-foreground\)\)[^}]*\},)/s,
        `$1\n${chartLines}`
      )
      patches.push("chart colors")
    }
  }

  // Ensure tailwindcss-animate is in plugins
  if (!/tailwindcss-animate/.test(content)) {
    if (/plugins\s*:\s*\[\s*\]/.test(content)) {
      content = content.replace(
        /plugins\s*:\s*\[\s*\]/,
        `plugins: [require("tailwindcss-animate")]`
      )
    } else if (/plugins\s*:\s*\[/.test(content)) {
      content = content.replace(
        /plugins\s*:\s*\[/,
        `plugins: [require("tailwindcss-animate"), `
      )
    } else {
      content = content.replace(
        /module\.exports\s*=\s*\{/,
        `module.exports = {\n  plugins: [require("tailwindcss-animate")],`
      )
    }
    patches.push("tailwindcss-animate plugin")
  }

  if (content !== original) {
    fs.writeFileSync(targetPath, content, "utf8")
    console.log(
      pc.green(`✔ Updated ${pc.cyan(foundFile)} (${patches.join(", ")})`)
    )
  }
}

function buildTailwindExtendBlock(opts: {
  includeColors: boolean
  includeBorderRadius: boolean
  includeBorderWidth: boolean
  includeKeyframes: boolean
}): string {
  const parts: string[] = []
  if (opts.includeColors) {
    parts.push(`      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "chart-1": "hsl(var(--chart-1))",
        "chart-2": "hsl(var(--chart-2))",
        "chart-3": "hsl(var(--chart-3))",
        "chart-4": "hsl(var(--chart-4))",
        "chart-5": "hsl(var(--chart-5))",
      }`)
  }
  if (opts.includeBorderRadius) {
    parts.push(`      borderRadius: {
        "3xl": "calc(var(--radius) + 16px)",
        "2xl": "calc(var(--radius) + 8px)",
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      }`)
  }
  if (opts.includeBorderWidth) {
    parts.push(`      borderWidth: {
        hairline: hairlineWidth(),
      }`)
  }
  if (opts.includeKeyframes) {
    parts.push(`      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      }`)
    parts.push(`      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      }`)
  }
  return `{\n${parts.join(",\n")},\n    }`
}

function configureBabelConfig(projectPath: string) {
  const filenames = ["babel.config.js", "babel.config.cjs"]
  let foundFile: string | null = null
  for (const name of filenames) {
    if (fs.existsSync(path.join(projectPath, name))) {
      foundFile = name
      break
    }
  }

  if (foundFile) {
    const targetPath = path.join(projectPath, foundFile)
    let content = fs.readFileSync(targetPath, "utf8")
    if (!content.includes("nativewind/babel")) {
      content = content.replace(
        /presets:\s*\[\s*(['"])babel-preset-expo\1\s*\]/,
        `presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"]`
      )
      fs.writeFileSync(targetPath, content, "utf8")
      console.log(pc.green(`✔ Updated ${pc.cyan(foundFile)}`))
    }
  }
}

function configureRootImport(projectPath: string, cssRelativePath: string) {
  const possibleRootFiles = [
    "src/app/_layout.tsx",
    "app/_layout.tsx",
    "src/app/_layout.jsx",
    "app/_layout.jsx",
    "src/app/_layout.js",
    "app/_layout.js",
    "App.tsx",
    "App.jsx",
    "App.js",
    "src/App.tsx",
    "src/App.js",
  ]

  let foundFile: string | null = null
  for (const file of possibleRootFiles) {
    if (fs.existsSync(path.join(projectPath, file))) {
      foundFile = file
      break
    }
  }

  if (foundFile) {
    const targetPath = path.join(projectPath, foundFile)
    let content = fs.readFileSync(targetPath, "utf8")

    const fileDir = path.dirname(path.join(projectPath, foundFile))
    const absoluteCssPath = path.resolve(projectPath, cssRelativePath)
    let relativeImportPath = path.relative(fileDir, absoluteCssPath).replace(/\\/g, "/")

    if (!relativeImportPath.startsWith(".")) {
      relativeImportPath = "./" + relativeImportPath
    }

    const hasCssImport = content.includes("global.css") || content.includes("globals.css")

    if (!hasCssImport) {
      content = `import "${relativeImportPath}";\n` + content
      fs.writeFileSync(targetPath, content, "utf8")
      console.log(pc.green(`✔ Updated ${pc.cyan(foundFile)}`))
    }
  }
}

function configurePortalHost(projectPath: string) {
  const possibleRootFiles = [
    "src/app/_layout.tsx",
    "app/_layout.tsx",
    "src/app/_layout.jsx",
    "app/_layout.jsx",
    "src/app/_layout.js",
    "app/_layout.js",
    "App.tsx",
    "App.jsx",
    "App.js",
    "src/App.tsx",
    "src/App.js",
  ]

  let foundFile: string | null = null
  for (const file of possibleRootFiles) {
    if (fs.existsSync(path.join(projectPath, file))) {
      foundFile = file
      break
    }
  }

  if (!foundFile) return

  const targetPath = path.join(projectPath, foundFile)
  const content = fs.readFileSync(targetPath, "utf8")

  let next = content
  const changes: string[] = []

  // 1. Mount the PortalHost as the last child of the providers so native
  //    portal content (dialog, popover, dropdown, tooltip, ...) has a host.
  if (!next.includes("PortalHost")) {
    if (next.includes("</ThemeProvider>")) {
      next = next.replace(/(\s*)<\/ThemeProvider>/, "$1  <PortalHost />\n$1</ThemeProvider>")
      changes.push("PortalHost")
    } else if (next.includes("</>")) {
      next = next.replace(/(\s*)<\/>/, "$1  <PortalHost />\n$1</>")
      changes.push("PortalHost")
    }

    if (changes.includes("PortalHost")) {
      next = `import { PortalHost } from "@rn-primitives/portal";\n${next}`
    }
  }

  // 2. Wrap the app root in GestureHandlerRootView. rn-primitives overlay
  //    triggers rely on react-native-gesture-handler, and without this
  //    wrapper their presses silently fail on native, so overlays like
  //    popover/dialog/dropdown never open.
  if (!next.includes("GestureHandlerRootView")) {
    const openIdx = next.indexOf("<ThemeProvider")
    const closeToken = "</ThemeProvider>"
    const closeIdx = next.lastIndexOf(closeToken)

    if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
      const before = next.slice(0, openIdx)
      const middle = next.slice(openIdx, closeIdx + closeToken.length)
      const after = next.slice(closeIdx + closeToken.length)
      next =
        before +
        "<GestureHandlerRootView style={{ flex: 1 }}>\n      " +
        middle +
        "\n    </GestureHandlerRootView>" +
        after
      next = `import { GestureHandlerRootView } from "react-native-gesture-handler";\n${next}`
      changes.push("GestureHandlerRootView")
    }
  }

  if (changes.length === 0) return

  fs.writeFileSync(targetPath, next, "utf8")
  console.log(pc.green(`Updated ${pc.cyan(foundFile)} with ${changes.join(" + ")}`))
}
function adaptScaffoldedProject(projectPath: string, packageManager: string) {
  // 1. Delete lockfiles that do NOT match the selected package manager
  const lockfiles: Record<string, string[]> = {
    npm: ["package-lock.json"],
    yarn: ["yarn.lock"],
    pnpm: ["pnpm-lock.yaml"],
    bun: ["bun.lock", "bun.lockb"]
  }

  for (const [pm, files] of Object.entries(lockfiles)) {
    if (pm !== packageManager) {
      for (const file of files) {
        const filePath = path.join(projectPath, file)
        if (fs.existsSync(filePath)) {
          fs.removeSync(filePath)
        }
      }
    }
  }

  // 2. Remove packageManager property from package.json if it exists
  const packageJsonPath = path.join(projectPath, "package.json")
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = fs.readJsonSync(packageJsonPath)
      delete packageJson.packageManager
      fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 })
    } catch {}
  }
}

function hslToHex(hslStr: string): string {
  const parts = hslStr.split(/\s+/);
  if (parts.length < 3) return "#ffffff";
  const [hStr = "0", sStr = "0%", lStr = "0%"] = parts;
  const h = parseFloat(hStr);
  const s = parseFloat(sStr.replace("%", "")) / 100;
  const l = parseFloat(lStr.replace("%", "")) / 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function configureThemeTs(projectPath: string, baseColor: string) {
  // Find theme.ts file
  const possiblePaths = [
    "src/constants/theme.ts",
    "constants/theme.ts",
    "src/constants/theme.js",
    "constants/theme.js",
  ]
  let foundPath: string | null = null
  for (const p of possiblePaths) {
    if (fs.existsSync(path.join(projectPath, p))) {
      foundPath = p
      break
    }
  }

  if (!foundPath) return

  const targetPath = path.join(projectPath, foundPath)
  let content = fs.readFileSync(targetPath, "utf8")

  // Get HSL config for the selected base color
  let resolvedColor: "zinc" | "slate" | "stone" | "gray" | "neutral" | "taupe" | "mauve" | "olive" | "mist" = "zinc";
  if (baseColor in THEME_COLORS) {
    resolvedColor = baseColor as any;
  } else {
    resolvedColor = "neutral";
  }
  const colorConfig = THEME_COLORS[resolvedColor];

  // Convert HSL to Hex
  const hexBackground = hslToHex(colorConfig.hsl.light.background)
  const hexForeground = hslToHex(colorConfig.hsl.light.foreground)
  const hexMuted = hslToHex(colorConfig.hsl.light.muted)
  const hexAccent = hslToHex(colorConfig.hsl.light.accent)
  const hexMutedForeground = hslToHex(colorConfig.hsl.light["muted-foreground"])

  const hexBackgroundDark = hslToHex(colorConfig.hsl.dark.background)
  const hexForegroundDark = hslToHex(colorConfig.hsl.dark.foreground)
  const hexMutedDark = hslToHex(colorConfig.hsl.dark.muted)
  const hexAccentDark = hslToHex(colorConfig.hsl.dark.accent)
  const hexMutedForegroundDark = hslToHex(colorConfig.hsl.dark["muted-foreground"])

  const newColorsBlock = `export const Colors = {
  light: {
    text: '${hexForeground}',
    background: '${hexBackground}',
    backgroundElement: '${hexMuted}',
    backgroundSelected: '${hexAccent}',
    textSecondary: '${hexMutedForeground}',
  },
  dark: {
    text: '${hexForegroundDark}',
    background: '${hexBackgroundDark}',
    backgroundElement: '${hexMutedDark}',
    backgroundSelected: '${hexAccentDark}',
    textSecondary: '${hexMutedForegroundDark}',
  },
} as const;`

  // Replace Colors definition in the file
  content = content.replace(
    /export\s+const\s+Colors\s*=\s*\{[\s\S]*?\}\s*as\s+const;/g,
    newColorsBlock
  )

  fs.writeFileSync(targetPath, content, "utf8")
  console.log(pc.green(`✔ Configured theme colors in ${pc.cyan(foundPath)}`))
}