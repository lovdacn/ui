#!/usr/bin/env node
import { Command } from "commander"
import { init } from "./commands/init"
import { add } from "./commands/add"
import { preset } from "./commands/preset"
import { version } from "../package.json"

const program = new Command()
  .name("lovdacn")
  .description("A CLI to initialize and manage Expo/NativeWind projects")
  .version(version)

program.addCommand(init)
program.addCommand(add)
program.addCommand(preset)

program.parse(process.argv)
