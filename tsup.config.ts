import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["cli/index.ts"],
  format: ["cjs"],
  sourcemap: true,
  target: "esnext",
  outDir: "build",
});
