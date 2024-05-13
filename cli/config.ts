import YAML from "yaml";
import { readFile } from "fs/promises";
import { configSchema } from "./schema.js";

export async function readConfig(path: string) {
  const configFile = await readFile(path, "utf-8");

  const config = YAML.parse(configFile);

  const validatedConfig = configSchema.parse(config);

  return validatedConfig;
}
