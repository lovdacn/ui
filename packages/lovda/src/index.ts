#!/usr/bin/env node
import { Command } from "commander"
import { init } from "./commands/init"
import { add } from "./commands/add"
import { preset } from "./commands/preset"

const program = new Command()
  .name("lovda")
  .description("A CLI to initialize and manage Expo/NativeWind projects")
  .version("0.1.0")

program.addCommand(init)
program.addCommand(add)
program.addCommand(preset)

program.parse(process.argv)
