import { Command } from "commander"
import path from "path"
import fs from "fs-extra"
import pc from "picocolors"
import prompts from "prompts"
import { execa } from "execa"

import {
  decodePreset,
  encodePreset,
  isPresetCode,
  PRESET_STYLES,
  FONT_PACKAGES,
  FONT_FAMILIES,
  ICON_PACKAGES,
  RADIUS_VALUES,
  type PresetConfig,
} from "../preset/index.js"
import { DEFAULT_PRESETS } from "../preset/defaults.js"
import { runAdd } from "./add.js"
import { regenerateProjectCss } from "./init.js"

// ─── Decode subcommand ───────────────────────────────────────────────────────

export const decode = new Command()
  .name("decode")
  .description("decode a preset code into its values")
  .argument("<code>", "the preset code to decode")
  .option("--json", "output as JSON", false)
  .action((code, opts) => {
    const decoded = decodePreset(code)
    if (!decoded) {
      console.error(pc.red(`Invalid preset code: ${code}`))
      process.exit(1)
    }

    if (opts.json) {
      console.log(JSON.stringify({ code, values: decoded }, null, 2))
      return
    }

    console.log()
    console.log(`  ${pc.bold("Preset Code:")} ${pc.cyan(code)}`)
    console.log()
    console.log(`  ${pc.dim("style:")}        ${decoded.style}`)
    console.log(`  ${pc.dim("baseColor:")}    ${decoded.baseColor}`)
    console.log(`  ${pc.dim("theme:")}        ${decoded.theme}`)
    console.log(`  ${pc.dim("chartColor:")}   ${decoded.chartColor}`)
    console.log(`  ${pc.dim("font:")}         ${decoded.font} (${FONT_FAMILIES[decoded.font]})`)
    console.log(`  ${pc.dim("iconLibrary:")} ${decoded.iconLibrary} (${ICON_PACKAGES[decoded.iconLibrary]})`)
    console.log(`  ${pc.dim("radius:")}       ${decoded.radius} (${RADIUS_VALUES[decoded.radius]})`)
    console.log()
  })

// ─── Resolve subcommand ──────────────────────────────────────────────────────

export const resolve = new Command()
  .name("resolve")
  .description("resolve the current preset from your project's lvcn.json")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("--json", "output as JSON", false)
  .action(async (opts) => {
    const cwd = path.resolve(opts.cwd)
    const lvcnPath = path.join(cwd, "lvcn.json")

    if (!fs.existsSync(lvcnPath)) {
      console.error(pc.red("No lvcn.json found. Run 'init' first."))
      process.exit(1)
    }

    const config = fs.readJsonSync(lvcnPath)

    const presetConfig: Partial<PresetConfig> = {
      style: config.style,
      baseColor: config.baseColor,
      theme: config.theme,
      chartColor: config.chartColor,
      font: config.font,
      iconLibrary: config.iconLibrary,
      radius: config.radius,
    }

    // Clean undefined values
    for (const key of Object.keys(presetConfig) as (keyof PresetConfig)[]) {
      if (presetConfig[key] === undefined) {
        delete presetConfig[key]
      }
    }

    const code = encodePreset(presetConfig)
    const decoded = decodePreset(code)!

    if (opts.json) {
      console.log(JSON.stringify({ code, values: decoded }, null, 2))
      return
    }

    console.log()
    console.log(`  ${pc.bold("Current Preset:")} ${pc.cyan(code)}`)
    console.log()
    console.log(`  ${pc.dim("style:")}        ${decoded.style}`)
    console.log(`  ${pc.dim("baseColor:")}    ${decoded.baseColor}`)
    console.log(`  ${pc.dim("theme:")}        ${decoded.theme}`)
    console.log(`  ${pc.dim("chartColor:")}   ${decoded.chartColor}`)
    console.log(`  ${pc.dim("font:")}         ${decoded.font} (${FONT_FAMILIES[decoded.font]})`)
    console.log(`  ${pc.dim("iconLibrary:")} ${decoded.iconLibrary} (${ICON_PACKAGES[decoded.iconLibrary]})`)
    console.log(`  ${pc.dim("radius:")}       ${decoded.radius} (${RADIUS_VALUES[decoded.radius]})`)
    console.log()
    console.log(`  ${pc.dim("Run with:")} ${pc.green(`npx lovdacn init --preset ${code}`)}`)
    console.log()
  })

// ─── Apply subcommand ────────────────────────────────────────────────────────

export const apply = new Command()
  .name("apply")
  .description("apply a preset to your existing project")
  .argument("<preset>", "preset code or named preset (e.g., nova, sera, a3Kx)")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-y, --yes", "skip confirmation prompt", false)
  .option(
    "-p, --package-manager <pm>",
    "package manager to use (npm, yarn, pnpm, bun)"
  )
  .action(async (presetArg, opts) => {
    const cwd = path.resolve(opts.cwd)
    const lvcnPath = path.join(cwd, "lvcn.json")

    if (!fs.existsSync(lvcnPath)) {
      console.error(pc.red("No lvcn.json found. Run 'init' first."))
      process.exit(1)
    }

    // Resolve preset: named preset, preset code, or style name
    let presetConfig: PresetConfig

    const namedPreset = DEFAULT_PRESETS[presetArg]
    if (namedPreset) {
      const { title, description, ...config } = namedPreset
      presetConfig = config
    } else if (isPresetCode(presetArg)) {
      const decoded = decodePreset(presetArg)
      if (!decoded) {
        console.error(pc.red(`Invalid preset code: ${presetArg}`))
        process.exit(1)
      }
      presetConfig = decoded
    } else if ((PRESET_STYLES as readonly string[]).includes(presetArg)) {
      // Just a style name — use its default preset if available, otherwise encode with defaults
      const stylePreset = DEFAULT_PRESETS[presetArg]
      if (stylePreset) {
        const { title, description, ...config } = stylePreset
        presetConfig = config
      } else {
        presetConfig = { ...decodePreset(encodePreset({ style: presetArg as PresetConfig["style"] }))! }
      }
    } else {
      console.error(pc.red(`Unknown preset: ${presetArg}`))
      console.error(pc.dim(`Use a named preset (${Object.keys(DEFAULT_PRESETS).join(", ")}), a preset code, or a style name.`))
      process.exit(1)
    }

    const lvcnConfig = fs.readJsonSync(lvcnPath)
    const styleEngine = lvcnConfig.styleEngine || "nativewind"

    // Show what will change
    console.log()
    console.log(`  ${pc.bold("Applying preset:")} ${pc.cyan(presetArg)}`)
    console.log()
    console.log(`  ${pc.dim("style:")}        ${lvcnConfig.style || "—"} → ${pc.green(presetConfig.style)}`)
    console.log(`  ${pc.dim("baseColor:")}    ${lvcnConfig.baseColor || "—"} → ${pc.green(presetConfig.baseColor)}`)
    console.log(`  ${pc.dim("theme:")}        ${lvcnConfig.theme || "—"} → ${pc.green(presetConfig.theme)}`)
    console.log(`  ${pc.dim("chartColor:")}   ${lvcnConfig.chartColor || "—"} → ${pc.green(presetConfig.chartColor)}`)
    console.log(`  ${pc.dim("font:")}         ${lvcnConfig.font || "—"} → ${pc.green(presetConfig.font)} (${FONT_FAMILIES[presetConfig.font]})`)
    console.log(`  ${pc.dim("iconLibrary:")} ${lvcnConfig.iconLibrary || "—"} → ${pc.green(presetConfig.iconLibrary)} (${ICON_PACKAGES[presetConfig.iconLibrary]})`)
    console.log(`  ${pc.dim("radius:")}       ${lvcnConfig.radius || "—"} → ${pc.green(presetConfig.radius)} (${RADIUS_VALUES[presetConfig.radius]})`)
    console.log(`  ${pc.dim("engine:")}       ${styleEngine} (unchanged)`)
    console.log()

    if (!opts.yes) {
      const { proceed } = await prompts({
        type: "confirm",
        name: "proceed",
        message: "Apply this preset? (will overwrite styles and re-install components)",
        initial: true,
      })
      if (!proceed) {
        process.exit(0)
      }
    }

    // 1. Update lvcn.json
    lvcnConfig.style = presetConfig.style
    lvcnConfig.baseColor = presetConfig.baseColor
    lvcnConfig.theme = presetConfig.theme
    lvcnConfig.chartColor = presetConfig.chartColor
    lvcnConfig.font = presetConfig.font
    lvcnConfig.iconLibrary = presetConfig.iconLibrary
    lvcnConfig.radius = presetConfig.radius
    fs.writeJsonSync(lvcnPath, lvcnConfig, { spaces: 2 })
    console.log(pc.green(`✔ Updated lvcn.json`))

    // 2. Regenerate global.css (full color + theme + chart pipeline)
    const cssRelativePath = lvcnConfig.tailwind?.css || "src/global.css"
    const cssPath = path.join(cwd, cssRelativePath)
    if (fs.existsSync(cssPath)) {
      await regenerateProjectCss({
        projectPath: cwd,
        styleEngine,
        cssRelativePath,
        style: presetConfig.style,
        baseColor: presetConfig.baseColor,
        theme: presetConfig.theme,
        chartColor: presetConfig.chartColor,
      })
    }

    // 3. Install font package
    const packageManager = opts.packageManager || detectPackageManager(cwd)
    const fontPkg = FONT_PACKAGES[presetConfig.font]
    if (fontPkg) {
      console.log(pc.blue(`Installing font: ${pc.cyan(fontPkg)}...`))
      try {
        await execa(packageManager, ["install", fontPkg], { cwd, stdio: "inherit" })
      } catch {
        console.log(pc.yellow(`⚠ Could not install ${fontPkg}. Install manually.`))
      }
    }

    // 4. Install icon library package
    const iconPkg = ICON_PACKAGES[presetConfig.iconLibrary]
    if (iconPkg && presetConfig.iconLibrary !== "expo") {
      // Skip @expo/vector-icons as it's built-in
      const deps = [iconPkg, "react-native-svg"]
      console.log(pc.blue(`Installing icons: ${pc.cyan(deps.join(", "))}...`))
      try {
        await execa(packageManager, ["install", ...deps], { cwd, stdio: "inherit" })
      } catch {
        console.log(pc.yellow(`⚠ Could not install icon packages. Install manually.`))
      }
    }

    // 5. Re-install all existing components with new style
    const installedComponents = lvcnConfig.components || []
    if (installedComponents.length > 0) {
      console.log(pc.blue(`\nRe-installing ${installedComponents.length} component(s) with ${pc.cyan(presetConfig.style)} style...`))
      await runAdd({
        components: installedComponents,
        yes: true,
        overwrite: true,
        cwd,
        packageManager: packageManager as any,
      })
    }

    console.log()
    console.log(pc.green(`✔ Preset ${pc.cyan(presetArg)} applied successfully! 🎉`))
    console.log()
  })

// ─── Main preset command ─────────────────────────────────────────────────────

export const preset = new Command()
  .name("preset")
  .description("manage design presets")
  .addCommand(decode)
  .addCommand(resolve)
  .addCommand(apply)
  .action(() => {
    preset.outputHelp()
  })

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectPackageManager(cwd: string): "npm" | "yarn" | "pnpm" | "bun" {
  if (fs.existsSync(path.join(cwd, "bun.lockb")) || fs.existsSync(path.join(cwd, "bun.lock"))) return "bun"
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm"
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn"
  if (fs.existsSync(path.join(cwd, "package-lock.json"))) return "npm"
  return "npm"
}
