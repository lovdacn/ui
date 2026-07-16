#!/usr/bin/env node
import { Command } from "commander"
import { init } from "./commands/init"
import { add } from "./commands/add"
import { apply } from "./commands/apply"
import { present } from "./commands/present"
import { version } from "../package.json"

const program = new Command()
  .name("lovdacn")
  .description("A CLI to initialize and manage Expo/NativeWind projects")
  .version(version)

program.addCommand(init)
program.addCommand(add)
program.addCommand(apply)
program.addCommand(present)

program.parse(process.argv)
