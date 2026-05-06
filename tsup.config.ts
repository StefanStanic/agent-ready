import { defineConfig } from "tsup";
import type { Options } from "tsup";

const shared: Omit<Options, "entry" | "dts" | "clean" | "banner"> = {
  format: ["esm", "cjs"],
  sourcemap: true,
  splitting: false,
  outDir: "dist",
  outExtension({ format }) {
    if (format === "cjs") {
      return { js: ".cjs" };
    }

    return { js: ".js" };
  }
};

export default defineConfig([
  {
    ...shared,
    entry: {
      index: "src/index.ts"
    },
    dts: {
      entry: "src/index.ts"
    },
    clean: true
  },
  {
    ...shared,
    entry: {
      cli: "src/cli.ts"
    },
    dts: {
      entry: "src/cli.ts"
    },
    banner: {
      js: "#!/usr/bin/env node"
    }
  }
]);
