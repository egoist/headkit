#!/usr/bin/env node
import Enquirer from "enquirer"
import { execa } from "execa"

const packages = await execa("pnpm", [
  "ls",
  "-r",
  "--depth",
  "-1",
  "--json",
]).then((res) => JSON.parse(res.stdout))

const { name } = await Enquirer.prompt({
  name: "name",
  message: "Choose a package to run",
  type: "select",
  choices: packages
    .filter((p) => p.name.startsWith("test-"))
    .map((p) => {
      return {
        name: p.name,
        value: p.name,
      }
    }),
})

execa("tasco", ["run", "--filter", name, "dev"], {
  stdio: "inherit",
})
