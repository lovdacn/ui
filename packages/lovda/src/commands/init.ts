import { Command } from "commander"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs-extra"
import prompts from "prompts"
import { execa } from "execa"
import pc from "picocolors"
import { z } from "zod"

import { REGISTRY_URL } from "../config.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const initOptionsSchema = z.object({
  cwd: z.string(),
  name: z.string().optional(),
  yes: z.boolean().default(false),
  force: z.boolean().default(false),
  packageManager: z.enum(["npm", "yarn", "pnpm", "bun"]).optional(),
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
  let style: "new-york" | "mira" = "new-york"

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
      styleEngine = "nativewind"
    } else {
      const detectedPM = getPackageManager(cwd)
      const questions: prompts.PromptObject[] = []

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

      if (!projectName) {
        questions.push({
          type: "text",
          name: "projectName",
          message: "What is your project named?",
          initial: (prev: string) => prev === "uniwind" ? "uniwind-app" : "nativewind-app",
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
        !response.styleEngine ||
        !response.style
      ) {
        process.exit(0)
      }
      projectName = projectName || response.projectName.trim()
      packageManager = packageManager || (response.packageManager as "npm" | "yarn" | "pnpm" | "bun")
      styleEngine = response.styleEngine
      style = response.style
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

  const hasSrcDir = fs.existsSync(path.join(projectPath, "src"))
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
    await configureGlobalCss(projectPath, styleEngine, cssRelativePath, style)

    // 3. Copy tailwind.config.js if not exists
    const templateTailwindPath = path.join(templateDir, "tailwind.config.js")
    const projectTailwindPath = path.join(projectPath, "tailwind.config.js")
    if (fs.existsSync(templateTailwindPath) && !fs.existsSync(projectTailwindPath)) {
      fs.copySync(templateTailwindPath, projectTailwindPath)
      console.log(pc.green(`✔ Created ${pc.cyan("tailwind.config.js")}`))
    }

    // 4. Configure metro.config.js
    configureMetroConfig(projectPath, styleEngine, cssRelativePath, hasSrcDir)

    // 5. Configure babel.config.js (for nativewind only)
    if (styleEngine === "nativewind") {
      configureBabelConfig(projectPath)
    }

    // 6. Configure root file import for global.css
    configureRootImport(projectPath, cssRelativePath)
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
    await configureGlobalCss(projectPath, styleEngine, cssRelativePath, style)
  }

  // Update/merge lvcn.json
  if (fs.existsSync(lvcnJsonPath)) {
    const templateLvcn = fs.readJsonSync(lvcnJsonPath)
    const mergedConfig = {
      ...templateLvcn,
      style: style,
      styleEngine: styleEngine,
      ...(existingLvcnConfig || {}),
      aliases: {
        ...templateLvcn.aliases,
        ...((existingLvcnConfig && existingLvcnConfig.aliases) || {}),
      },
      tailwind: {
        ...templateLvcn.tailwind,
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
        ? ["uniwind", "tailwindcss", "class-variance-authority"]
        : ["nativewind", "tailwindcss", "class-variance-authority"]
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

async function configureGlobalCss(projectPath: string, styleEngine: "nativewind" | "uniwind", cssRelativePath: string, style: string) {
  const cssPath = path.join(projectPath, cssRelativePath)
  fs.ensureDirSync(path.dirname(cssPath))

  const styleCssContent = await fetchStyleCss(style)

  let content = '@import "tailwindcss";\n'
  if (styleEngine === "uniwind") {
    content += '@import "uniwind";\n'
  }

  if (styleCssContent) {
    content += "\n" + styleCssContent
  } else {
    content += `\n:root {
  --font-display:
    Spline Sans, Inter, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji,
    Segoe UI Symbol, Noto Color Emoji;
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
  --font-rounded: 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif;
  --font-serif: Georgia, 'Times New Roman', serif;
}\n`
  }

  fs.writeFileSync(cssPath, content, "utf8")
  console.log(pc.green(`✔ Configured global CSS for style ${pc.cyan(style)}`))
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

async function fetchStyleCss(style: string): Promise<string> {
  const registryUrl = getRegistryUrl()

  if (registryUrl.startsWith("file://") || !registryUrl.startsWith("http")) {
    const cleanPath = registryUrl.replace("file://", "")
    const stylePath = path.resolve(cleanPath, `styles/style-${style}.css`)
    if (fs.existsSync(stylePath)) {
      return fs.readFileSync(stylePath, "utf8")
    }
  } else {
    try {
      const response = await fetch(`${registryUrl}/styles/style-${style}.css`)
      if (response.ok) {
        return await response.text()
      }
    } catch {
      // Ignore network errors and fall back
    }
  }
  return ""
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