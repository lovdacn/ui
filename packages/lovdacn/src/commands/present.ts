import { Command } from "commander"
import path from "path"
import fs from "fs-extra"
import pc from "picocolors"

import {
  decodePreset,
  encodePreset,
  FONT_FAMILIES,
  ICON_PACKAGES,
  RADIUS_VALUES,
  type PresetConfig,
} from "../preset/index.js"

// ─── present command ─────────────────────────────────────────────────────────
// Read-only. Shows the CURRENT preset of the project (resolved from lvcn.json)
// and its shareable code. Makes no changes — use `apply <code>` to change styles.

export const present = new Command()
  .name("present")
  .description("show the current preset of your project (read-only)")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("--json", "output as JSON", false)
  .action((opts) => {
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

    // Drop undefined values so encodePreset falls back to defaults.
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
    console.log(`  ${pc.bold("Current preset:")} ${pc.cyan(code)}`)
    console.log()
    console.log(`  ${pc.dim("style:")}        ${decoded.style}`)
    console.log(`  ${pc.dim("baseColor:")}    ${decoded.baseColor}`)
    console.log(`  ${pc.dim("theme:")}        ${decoded.theme}`)
    console.log(`  ${pc.dim("chartColor:")}   ${decoded.chartColor}`)
    console.log(`  ${pc.dim("font:")}         ${decoded.font} (${FONT_FAMILIES[decoded.font]})`)
    console.log(`  ${pc.dim("iconLibrary:")} ${decoded.iconLibrary} (${ICON_PACKAGES[decoded.iconLibrary]})`)
    console.log(`  ${pc.dim("radius:")}       ${decoded.radius} (${RADIUS_VALUES[decoded.radius]})`)
    console.log()
    console.log(`  ${pc.dim("Apply a new one:")} ${pc.green("npx lovdacn apply <code>")}`)
    console.log()
  })
