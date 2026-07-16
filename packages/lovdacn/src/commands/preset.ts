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
import { runAdd, getInstalledComponents, resolveAliasPath } from "./add.js"
import { regenerateProjectCss } from "./init.js"
import { snapshotFiles, restoreFiles } from "../utils/file-backup.js"

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
  .option("-f, --force", "proceed even if the git working tree is dirty", false)
  .option(
    "--only <parts>",
    "apply only parts of a preset (comma-separated): theme, colors, font, radius"
  )
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

    // Parse --only into the set of dimensions to apply. Undefined = full apply.
    const ONLY_PARTS = ["theme", "colors", "font", "radius"] as const
    let only: Set<string> | undefined
    if (opts.only) {
      const parts = String(opts.only)
        .split(",")
        .map((p: string) => p.trim().toLowerCase())
        .filter(Boolean)
      const invalid = parts.filter((p: string) => !(ONLY_PARTS as readonly string[]).includes(p))
      if (parts.length === 0 || invalid.length > 0) {
        console.error(pc.red(`Invalid --only value: ${opts.only}`))
        console.error(pc.dim(`  Use one or more of: ${ONLY_PARTS.join(", ")}. Example: --only theme,font`))
        process.exit(1)
      }
      only = new Set(parts)
    }

    const wants = (part: string) => !only || only.has(part)
    const reinstall = !only

    // Effective config: a full apply takes everything from the preset; --only
    // keeps current values except for the requested dimensions. Style is never
    // changed by a partial apply (a style change implies a component re-install).
    const effective: PresetConfig = {
      style: only ? (lvcnConfig.style || presetConfig.style) : presetConfig.style,
      baseColor: wants("colors") ? presetConfig.baseColor : (lvcnConfig.baseColor ?? presetConfig.baseColor),
      theme: wants("theme") ? presetConfig.theme : (lvcnConfig.theme ?? presetConfig.theme),
      chartColor: wants("theme") ? presetConfig.chartColor : (lvcnConfig.chartColor ?? presetConfig.chartColor),
      font: wants("font") ? presetConfig.font : (lvcnConfig.font ?? presetConfig.font),
      iconLibrary: lvcnConfig.iconLibrary ?? presetConfig.iconLibrary, // never changed
      radius: wants("radius") ? presetConfig.radius : (lvcnConfig.radius ?? presetConfig.radius),
    }

    const row = (label: string, from: any, to: any, extra: string, applies: boolean) => {
      const key = pc.dim((label + ":").padEnd(13))
      if (applies && from !== to) {
        console.log(`  ${key}${from || "—"} → ${pc.green(to)}${extra ? " " + extra : ""}`)
      } else {
        console.log(`  ${key}${(from ?? to) || "—"} ${pc.dim("(unchanged)")}`)
      }
    }

    // Show what will change
    console.log()
    console.log(`  ${pc.bold("Applying preset:")} ${pc.cyan(presetArg)}${only ? pc.dim(`  (only: ${[...only].join(", ")})`) : ""}`)
    console.log()
    row("style", lvcnConfig.style, effective.style, "", !only)
    row("baseColor", lvcnConfig.baseColor, effective.baseColor, "", wants("colors"))
    row("theme", lvcnConfig.theme, effective.theme, "", wants("theme"))
    row("chartColor", lvcnConfig.chartColor, effective.chartColor, "", wants("theme"))
    row("font", lvcnConfig.font, effective.font, `(${FONT_FAMILIES[effective.font]})`, wants("font"))
    console.log(`  ${pc.dim("iconLibrary:".padEnd(13))}${lvcnConfig.iconLibrary || "—"} ${pc.dim("(unchanged — switch icons manually)")}`)
    row("radius", lvcnConfig.radius, effective.radius, `(${RADIUS_VALUES[effective.radius]})`, wants("radius"))
    console.log(`  ${pc.dim("engine:".padEnd(13))}${styleEngine} ${pc.dim("(unchanged)")}`)
    console.log()

    // Git-clean guard: apply overwrites CSS and re-installs components.
    if (!opts.force) {
      const dirty = await isGitDirty(cwd)
      if (dirty) {
        console.log(pc.yellow("⚠ Your git working tree has uncommitted changes."))
        console.log(pc.dim("  apply overwrites global.css and re-installs components. Commit or stash first, or pass --force."))
        console.log()
        if (!opts.yes) {
          const { proceed } = await prompts({
            type: "confirm",
            name: "proceed",
            message: "Continue anyway?",
            initial: false,
          })
          if (!proceed) process.exit(0)
        }
      }
    }

    if (!opts.yes) {
      const { proceed } = await prompts({
        type: "confirm",
        name: "proceed",
        message: reinstall
          ? "Apply this preset? (will overwrite styles and re-install components)"
          : "Apply the selected preset parts? (will update styles)",
        initial: true,
      })
      if (!proceed) {
        process.exit(0)
      }
    }

    const cssRelativePath = lvcnConfig.tailwind?.css || "src/global.css"
    const cssPath = path.join(cwd, cssRelativePath)
    const packageManager = opts.packageManager || detectPackageManager(cwd)

    // Detect installed components up-front (used by both the snapshot and the
    // re-install step). Reconciles the tracked list with what's on disk.
    const installedComponents = getInstalledComponents(
      cwd,
      lvcnConfig.aliases,
      lvcnConfig.components || []
    )

    // Snapshot everything apply may overwrite so we can roll back on failure.
    const aliases = lvcnConfig.aliases || {}
    const snapshotPaths = [lvcnPath, cssPath]
    const utilsAlias = resolveAliasPath(cwd, aliases.utils || "@/lib/utils")
    snapshotPaths.push(
      utilsAlias.endsWith(".ts") || utilsAlias.endsWith(".js")
        ? utilsAlias
        : utilsAlias + (lvcnConfig.tsx ? ".ts" : ".js")
    )
    const uiDir = resolveAliasPath(cwd, aliases.ui || "@/components/ui")
    if (fs.existsSync(uiDir)) {
      for (const f of fs.readdirSync(uiDir)) snapshotPaths.push(path.join(uiDir, f))
    }
    const backup = snapshotFiles(snapshotPaths)

    try {
      // 1. Update lvcn.json (applied dimensions only; icons untouched).
      lvcnConfig.style = effective.style
      lvcnConfig.baseColor = effective.baseColor
      lvcnConfig.theme = effective.theme
      lvcnConfig.chartColor = effective.chartColor
      lvcnConfig.font = effective.font
      lvcnConfig.radius = effective.radius
      fs.writeJsonSync(lvcnPath, lvcnConfig, { spaces: 2 })
      console.log(pc.green(`✔ Updated lvcn.json`))

      // 2. Regenerate global.css from the effective config.
      if (fs.existsSync(cssPath)) {
        await regenerateProjectCss({
          projectPath: cwd,
          styleEngine,
          cssRelativePath,
          style: effective.style,
          baseColor: effective.baseColor,
          theme: effective.theme,
          chartColor: effective.chartColor,
          font: effective.font,
          radius: effective.radius,
        })
      }

      // 3. Install the font package when the font is being applied.
      if (wants("font")) {
        const fontPkg = FONT_PACKAGES[effective.font]
        if (fontPkg) {
          console.log(pc.blue(`Installing font: ${pc.cyan(fontPkg)}...`))
          try {
            await execa(packageManager, ["install", fontPkg], { cwd, stdio: "inherit" })
          } catch {
            console.log(pc.yellow(`⚠ Could not install ${fontPkg}. Install manually.`))
          }
        }
      }

      // 4. Icons are intentionally left untouched — switching icon libraries is
      //    manual. Only print a note when the preset's icon library differs.
      const currentIconLibrary = lvcnConfig.iconLibrary || "lucide"
      if (presetConfig.iconLibrary !== currentIconLibrary) {
        const iconPkg = ICON_PACKAGES[presetConfig.iconLibrary]
        console.log()
        console.log(pc.yellow(`ℹ This preset's icon library is ${pc.cyan(presetConfig.iconLibrary)}; your project uses ${pc.cyan(currentIconLibrary)}.`))
        console.log(pc.dim(`  Icons are left unchanged. To switch manually: install ${pc.cyan(iconPkg)} and update icon imports.`))
      }

      // 5. Re-install components with the new style (full apply only).
      if (reinstall && installedComponents.length > 0) {
        console.log(pc.blue(`\nRe-installing ${installedComponents.length} component(s) with ${pc.cyan(effective.style)} style...`))
        await runAdd({
          components: installedComponents,
          yes: true,
          overwrite: true,
          cwd,
          packageManager: packageManager as any,
        })
      }
    } catch (err) {
      console.error(pc.red("\n✖ Apply failed — rolling back changes..."))
      restoreFiles(backup)
      console.log(pc.yellow("✔ Restored lvcn.json, global.css, and component files to their previous state."))
      console.error(err instanceof Error ? err.message : String(err))
      process.exit(1)
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

async function isGitDirty(cwd: string): Promise<boolean> {
  try {
    const { stdout } = await execa("git", ["status", "--porcelain"], { cwd })
    return stdout.trim().length > 0
  } catch {
    // Not a git repo (or git unavailable) — don't block the user.
    return false
  }
}

function detectPackageManager(cwd: string): "npm" | "yarn" | "pnpm" | "bun" {
  if (fs.existsSync(path.join(cwd, "bun.lockb")) || fs.existsSync(path.join(cwd, "bun.lock"))) return "bun"
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm"
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn"
  if (fs.existsSync(path.join(cwd, "package-lock.json"))) return "npm"
  return "npm"
}
