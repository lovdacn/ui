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

const PORTAL_COMPONENTS = new Set([
  "alert-dialog",
  "context-menu",
  "dialog",
  "dropdown-menu",
  "hover-card",
  "popover",
  "select",
  "tooltip",
])

const PORTAL_DEPENDENCY = "@rn-primitives/portal@^1.5.2"
const GESTURE_HANDLER_DEPENDENCY = "react-native-gesture-handler"

// Detect whether the target project is an Expo project (so we can defer to
// `expo install` for SDK-compatible native module versions).
function isExpoProject(cwd: string): boolean {
  try {
    const pkg = fs.readJsonSync(path.join(cwd, "package.json"))
    return Boolean(pkg?.dependencies?.expo || pkg?.devDependencies?.expo)
  } catch {
    return false
  }
}

// Build the dependency-install command. For Expo projects we invoke the local
// `expo install` via the chosen package manager's runner; `expo install` pins
// native modules to the SDK's bundled versions and installs everything else
// normally. Non-Expo projects fall back to a plain package-manager install.
function getInstallCommand(
  packageManager: "npm" | "yarn" | "pnpm" | "bun",
  deps: string[],
  useExpo: boolean
): { cmd: string; args: string[] } {
  if (!useExpo) {
    return { cmd: packageManager, args: ["install", ...deps] }
  }
  switch (packageManager) {
    case "pnpm":
      return { cmd: "pnpm", args: ["exec", "expo", "install", ...deps] }
    case "yarn":
      return { cmd: "yarn", args: ["expo", "install", ...deps] }
    case "bun":
      return { cmd: "bunx", args: ["expo", "install", ...deps] }
    default:
      return { cmd: "npx", args: ["expo", "install", ...deps] }
  }
}

export const addOptionsSchema = z.object({
  components: z.array(z.string()).optional(),
  yes: z.boolean().default(false),
  overwrite: z.boolean().default(false),
  cwd: z.string(),
  packageManager: z.enum(["npm", "yarn", "pnpm", "bun"]).optional(),
})

export const add = new Command()
  .name("add")
  .description("add components to your project")
  .argument("[components...]", "the components to add")
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option("-o, --overwrite", "overwrite existing files.", false)
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option(
    "-p, --package-manager <package-manager>",
    "the package manager to use. (npm, yarn, pnpm, bun)"
  )
  .action(async (components, opts) => {
    try {
      const options = addOptionsSchema.parse({
        components,
        ...opts,
        cwd: path.resolve(opts.cwd),
      })
      await runAdd(options)
    } catch (error) {
      console.error(pc.red("\nComponent installation failed:"))
      console.error(error)
      process.exit(1)
    }
  })

export async function runAdd(options: z.infer<typeof addOptionsSchema>) {
  const cwd = options.cwd
  const lvcnPath = path.join(cwd, "lvcn.json")

  if (!fs.existsSync(lvcnPath)) {
    throw new Error(
      "Configuration file 'lvcn.json' not found. Please run 'init' first to configure your project."
    )
  }

  const lvcnConfig = fs.readJsonSync(lvcnPath)
  let componentsToAdd = options.components || []

  if (componentsToAdd.length === 0) {
    const AVAILABLE_COMPONENTS = [
      "accordion",
      "alert",
      "alert-dialog",
      "aspect-ratio",
      "avatar",
      "badge",
      "button",
      "card",
      "checkbox",
      "collapsible",
      "context-menu",
      "dialog",
      "dropdown-menu",
      "hover-card",
      "icon",
      "input",
      "label",
      "menubar",
      "native-only-animated-view",
      "popover",
      "progress",
      "radio-group",
      "select",
      "separator",
      "skeleton",
      "switch",
      "tabs",
      "text",
      "textarea",
      "toggle",
      "toggle-group",
      "tooltip"
    ]

    const response = await prompts({
      type: "multiselect",
      name: "components",
      message: "Which components would you like to add?",
      choices: AVAILABLE_COMPONENTS.map((c) => ({ title: c, value: c })),
      instructions: "Space to select. A to toggle all. Enter to submit."
    })
    if (!response.components || response.components.length === 0) {
      process.exit(0)
    }
    componentsToAdd = response.components
  }

  const style = lvcnConfig.style || "default"
  const styleEngine = lvcnConfig.styleEngine || "nativewind"
  const packageManager = options.packageManager || getPackageManager(cwd)

  const queue = [...componentsToAdd]
  const resolvedComponents = new Set<string>()
  const npmDependencies = new Set<string>()
  const filesToWrite: any[] = []

  while (queue.length > 0) {
    const componentName = queue.shift()!
    if (resolvedComponents.has(componentName)) {
      continue
    }

    console.log(pc.blue(`Resolving ${pc.cyan(componentName)}...`))

    // Fetch registry item
    let registryItem: any
    try {
      registryItem = await fetchRegistryItem(componentName, style, styleEngine)
    } catch (error: any) {
      throw new Error(
        `Component '${componentName}' not found in registry under style '${style}' and engine '${styleEngine}': ${error.message}`
      )
    }

    resolvedComponents.add(componentName)

    // Collect npm dependencies
    if (registryItem.dependencies) {
      registryItem.dependencies.forEach((dep: string) => npmDependencies.add(dep))
    }

    // Collect registry dependencies
    if (registryItem.registryDependencies) {
      registryItem.registryDependencies.forEach((dep: string) => {
        if (!resolvedComponents.has(dep)) {
          queue.push(dep)
        }
      })
    }

    // Collect files
    if (registryItem.files) {
      filesToWrite.push(...registryItem.files)
    }
  }

  if (Array.from(resolvedComponents).some((componentName) => PORTAL_COMPONENTS.has(componentName))) {
    npmDependencies.add(PORTAL_DEPENDENCY)
    npmDependencies.add(GESTURE_HANDLER_DEPENDENCY)
    configurePortalHost(cwd)
  }

  // Install npm dependencies in one run
  if (npmDependencies.size > 0) {
    const deps = Array.from(npmDependencies)
    console.log(
      pc.blue(`Installing npm dependencies: ${pc.cyan(deps.join(", "))}...`)
    )
    // For Expo projects, install through `expo install` so native modules
    // (react-native-gesture-handler, react-native-svg, etc.) are pinned to the
    // versions bundled with the project's Expo SDK. Installing them unpinned
    // pulls the latest major (e.g. gesture-handler 3.x) which crashes in Expo Go
    // with "installUIRuntimeBindings"/NativeProxy resolution errors.
    const { cmd, args } = getInstallCommand(packageManager, deps, isExpoProject(cwd))
    await execa(cmd, args, {
      cwd,
      stdio: "inherit",
    })
  }

  // Write files
  for (const file of filesToWrite) {
    const userAliases = lvcnConfig.aliases || {}
    const relativePath = file.path
    let targetPath: string

    if (relativePath.startsWith("components/ui/")) {
      const fileBasename = path.basename(relativePath)
      const uiFolder = resolveAliasPath(cwd, userAliases.ui || "@/components/ui")
      targetPath = path.join(uiFolder, fileBasename)
    } else if (relativePath.startsWith("components/")) {
      const fileBasename = path.basename(relativePath)
      const compFolder = resolveAliasPath(cwd, userAliases.components || "@/components")
      targetPath = path.join(compFolder, fileBasename)
    } else if (relativePath.includes("utils")) {
      const utilsFile = resolveAliasPath(cwd, userAliases.utils || "@/lib/utils")
      targetPath =
        utilsFile.endsWith(".ts") || utilsFile.endsWith(".js")
          ? utilsFile
          : utilsFile + (lvcnConfig.tsx ? ".ts" : ".js")
    } else {
      targetPath = path.join(cwd, relativePath)
    }

    // Ensure target directory exists
    fs.ensureDirSync(path.dirname(targetPath))

    // Check if file exists and we are not overwriting
    if (fs.existsSync(targetPath) && !options.overwrite && !options.yes) {
      const confirm = await prompts({
        type: "confirm",
        name: "overwrite",
        message: `File ${pc.cyan(path.relative(cwd, targetPath))} already exists. Overwrite?`,
        initial: false,
      })
      if (!confirm.overwrite) {
        console.log(pc.yellow(`Skipped ${path.relative(cwd, targetPath)}`))
        continue
      }
    }

    // Rewrite aliases
    const rewrittenContent = rewriteImports(file.content, userAliases)

    // Write content
    fs.writeFileSync(targetPath, rewrittenContent, "utf8")
    console.log(pc.green(`✔ Created ${pc.cyan(path.relative(cwd, targetPath))}`))
  }

  // Register components in lvcn.json
  if (!lvcnConfig.components) {
    lvcnConfig.components = []
  }
  for (const componentName of resolvedComponents) {
    if (!lvcnConfig.components.includes(componentName)) {
      lvcnConfig.components.push(componentName)
    }
  }
  fs.writeJsonSync(lvcnPath, lvcnConfig, { spaces: 2 })

  console.log(pc.green("\nComponent(s) added successfully! 🎉"))
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

  // 1. Mount the PortalHost so native portal content has a host to render into.
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
  //    triggers rely on react-native-gesture-handler; without this wrapper
  //    their presses silently fail on native, so popover/dialog/dropdown/etc.
  //    never open.
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
function resolveAliasPath(cwd: string, alias: string): string {
  const cleanAlias = alias.replace(/^([@~]\/)/, "")

  // Check if a src directory exists and cleanAlias doesn't already start with 'src/'
  const hasSrc = fs.existsSync(path.join(cwd, "src"))
  if (hasSrc && !cleanAlias.startsWith("src/")) {
    return path.resolve(cwd, "src", cleanAlias)
  }

  return path.resolve(cwd, cleanAlias)
}

function rewriteImports(content: string, userAliases: Record<string, string>): string {
  const normalizeAlias = (alias: string) => alias.replace(/\/+$/, "")

  const uiAlias = normalizeAlias(userAliases.ui || "@/components/ui")
  const componentsAlias = normalizeAlias(userAliases.components || "@/components")
  const utilsAlias = normalizeAlias(userAliases.utils || "@/lib/utils")

  const uiToken = "__LOVDA_UI_ALIAS__"
  const utilsToken = "__LOVDA_UTILS_ALIAS__"

  let result = content
    // Normalize monorepo registry imports and older generated registry imports.
    .replace(/@\/registry\/(?:nativewind|uniwind)\//g, "@/")
    .replace(/~\/components\/ui\//g, "@/components/ui/")
    .replace(/~\/components\//g, "@/components/")
    .replace(/~\/lib\/utils/g, "@/lib/utils")

  result = result
    .replace(/@\/components\/ui\//g, `${uiToken}/`)
    .replace(/@\/lib\/utils/g, utilsToken)
    .replace(/@\/components\//g, `${componentsAlias}/`)
    .replace(new RegExp(`${uiToken}/`, "g"), `${uiAlias}/`)
    .replace(new RegExp(utilsToken, "g"), utilsAlias)

  return result
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

function getRegistryUrl(): string {
  if (process.env.LOVDA_REGISTRY_URL) {
    return process.env.LOVDA_REGISTRY_URL
  }

  // Try to find the locally served registry (apps/v2/public/r) in the workspace
  const possibleLocalPaths = [
    path.resolve(__dirname, "../../../apps/v2/public/r"),
    path.resolve(__dirname, "../../../../apps/v2/public/r"),
    path.resolve(__dirname, "../../apps/v2/public/r"),
    path.resolve(__dirname, "../../../../../apps/v2/public/r"),
    path.resolve(__dirname, "../../../../../../apps/v2/public/r"),
  ]

  for (const localPath of possibleLocalPaths) {
    if (fs.existsSync(localPath)) {
      return localPath
    }
  }

  return REGISTRY_URL
}

async function fetchRegistryItem(name: string, style: string, styleEngine: string): Promise<any> {
  const registryUrl = getRegistryUrl()

  if (registryUrl.startsWith("file://") || !registryUrl.startsWith("http")) {
    const cleanPath = registryUrl.replace("file://", "")
    const itemPath = path.resolve(cleanPath, `styles/${styleEngine}/${style}/${name}.json`)
    return await fs.readJson(itemPath)
  } else {
    const response = await fetch(`${registryUrl}/styles/${styleEngine}/${style}/${name}.json`)
    if (!response.ok) {
      throw new Error(`Failed to fetch component from registry: ${response.statusText}`)
    }
    return await response.json()
  }
}
