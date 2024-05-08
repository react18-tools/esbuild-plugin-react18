import { defineConfig, type Options } from "tsup";

export default defineConfig(
  (options: Options) =>
    ({
      format: ["cjs", "esm"],
      target: "es2019",
      entry: ["./src/index.ts"],
      sourcemap: false,
      clean: !options.watch,
      minify: !options.watch,
      bundle: true,
      dts: true,
      footer: { js: "module.exports = module.exports.default;" },
      ...options,
    }) as Options,
);
