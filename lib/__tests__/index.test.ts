import fs from "node:fs";
import path from "node:path";
import { describe, test, beforeAll } from "vitest";
import esbuild, { build } from "esbuild";
import react18Plugin, { React18PluginOptions } from "../src";
import glob from "tiny-glob";
import cssPlugin from "esbuild-plugin-react18-css";

const outDirPrefix = "./__tests__/build/";
const srcPattern = "../packages/shared/src/**/*.*";

/** Utility funciton to create build options and buildDir */
async function createEsBUildOptions(
  outDir: string,
  pluginOptions?: React18PluginOptions,
): Promise<esbuild.BuildOptions & { buildDir: string }> {
  const buildDir = path.resolve(__dirname, "build", outDir);
  try {
    fs.rmSync(buildDir, { recursive: true });
    fs.unlinkSync(buildDir);
  } catch {}
  return {
    format: "cjs",
    target: "es2019",
    sourcemap: false,
    bundle: true,
    minify: true,
    plugins: [react18Plugin(pluginOptions), cssPlugin()],
    entryPoints: await glob(srcPattern),
    external: ["react", "react-dom"],
    outdir: outDirPrefix + outDir,
    buildDir,
  };
}

describe.concurrent("Test plugin with ESBuild with default options", async () => {
  const { buildDir, ...options } = await createEsBUildOptions("default-options");

  beforeAll(async () => {
    await esbuild.build(options);
  });

  test(`"use client"; directive should be present in client components`, ({ expect }) => {
    const text = fs.readFileSync(path.resolve(buildDir, "client", "index.js"), "utf-8");
    expect(/^"use client";\n/m.test(text)).toBe(true);
  });
  test(`"use client"; directive should not be present in server components`, ({ expect }) => {
    const text = fs.readFileSync(path.resolve(buildDir, "server", "index.js"), "utf-8");
    expect(/^"use client";\n/m.test(text)).toBe(false);
  });
});

describe.concurrent("Test PlugInOptions", () => {
  /**
   * buildReplacePatterns could be very helpful in removing unnecessary comments introduced while bundling from other libraries
   */
  test('Test buildReplacePatterns: defaultBgColor should be "#3c3c3c" and defaultColor should be "#ccc"', async ({
    expect,
  }) => {
    const { buildDir, ...options } = await createEsBUildOptions("build-replace-patterns", {
      buildReplacePatterns: [
        {
          pathPattern: /constants/,
          replaceParams: [
            { pattern: /aaa/, substitute: "3c3c3c" },
            { pattern: /#555/, substitute: "#ccc" },
          ],
        },
      ],
    });
    await esbuild.build(options);
    const text = fs.readFileSync(path.resolve(buildDir, "server", "constants.js"), "utf-8");
    expect(text.includes("3c3c3c")).toBe(true);
  });

  test("Test plugin with ignorePatterns -- without content pattern", async ({ expect }) => {
    const { buildDir, ...optinos } = await createEsBUildOptions("ignore-patterns-0", {
      ignorePatterns: [{ pathPattern: /demo/ }],
    });
    await esbuild.build(optinos);
    expect(fs.existsSync(path.resolve(buildDir, "client", "demo"))).toBe(false);
  });

  /**
   * When content pattern is provided only the ignorePattern files having content matching the content pattern will be removed
   *
   * TODO: fix build with css and content ignore patterns
   */
  test.todo("Test plugin with ignorePatterns with content pattern", async ({ expect }) => {
    const { buildDir, ...optinos } = await createEsBUildOptions("ignore-patterns-1", {
      ignorePatterns: [{ pathPattern: /demo/, contentPatterns: [/ignore-me/] }],
    });
    await esbuild.build(optinos);
    expect(fs.existsSync(path.resolve(buildDir, "client", "demo"))).toBe(true);
    expect(fs.existsSync(path.resolve(buildDir, "client", "demo", "demo.tsx"))).toBe(false);
  });

  /** Fix The plugin didn't set a resolve directory for the file - so esbuild did not search for "react18-loaders" on the file system */
  test.todo("Test plugin with ignorePatterns with content pattern", async ({ expect }) => {
    const { buildDir, ...optinos } = await createEsBUildOptions("ignore-patterns-1", {
      ignorePatterns: [{ pathPattern: /global-loader/, contentPatterns: [/ignore-me/] }],
    });
    await esbuild.build(optinos);
    expect(fs.existsSync(path.resolve(buildDir, "client", "global-loader"))).toBe(true);
    expect(fs.existsSync(path.resolve(buildDir, "client", "global-loader", "dummy.ts"))).toBe(
      false,
    );
  });

  test('Test sourceReplacePatterns: defaultBgColor should be "#3c3c3c"', async ({ expect }) => {
    const { buildDir, ...options } = await createEsBUildOptions("source-replace-patterns", {
      sourceReplacePatterns: [
        {
          pathPattern: /constants/,
          replaceParams: [
            { pattern: /aaa/, substitute: "3c3c3c" },
            { pattern: /#555/, substitute: "#ccc" },
          ],
        },
        {
          pathPattern: /client/,
          replaceParams: [],
        },
      ],
    });
    await esbuild.build(options);
    const text = fs.readFileSync(path.resolve(buildDir, "server", "constants.js"), "utf-8");
    expect(text.includes("3c3c3c")).toBe(true);
  });
});
