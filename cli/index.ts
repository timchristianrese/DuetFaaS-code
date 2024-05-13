#!/usr/bin/env node
import "dotenv/config";
import yargs from "yargs";
import path from "path";
import { cp, mkdir, rm } from "fs/promises";
import { build } from "esbuild";

import { readConfig } from "./config.js";

const CLI_VERSION = "0.0.1";

async function main() {
  console.log(`You are running CLI version ${CLI_VERSION}`);

  const { config: configPath } = await yargs(process.argv.slice(2))
    .version(CLI_VERSION)
    .option("config", {
      describe: "specify path to the config file",
      type: "string",
    })
    .default("config", "config.yml")
    .help().argv;

  // Read config.yaml
  const config = await readConfig(path.join(process.cwd(), configPath));

  // Clean the .faas-duet directory
  await rm(path.join(process.cwd(), ".faas-duet"), { recursive: true });

  // Build the project
  await mkdir(path.join(process.cwd(), ".faas-duet"), { recursive: true });

  // Build first lambda
  await build({
    entryPoints: [config.lambda_a.entry],
    outdir: path.join(process.cwd(), ".faas-duet/lambda_a"),
    format: "esm",
    minify: true,
    bundle: true,
  });

  // Build second lambda
  await build({
    entryPoints: [config.lambda_b.entry],
    outdir: path.join(process.cwd(), ".faas-duet/lambda_b"),
    format: "esm",
    minify: true,
    bundle: true,
  });

  // Copy duet-server-template to .faas-duet
  await cp(
    path.join(process.cwd(), "cli", "duet-server-template"),
    path.join(process.cwd(), ".faas-duet"),
    {
      recursive: true,
    }
  );
}

main();
