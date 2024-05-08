import fs from "node:fs";
import path from "node:path";
import { describe, test } from "vitest";

/** testing tsup example (packages/shared) - make sure it is build before running this test suit */
describe.concurrent("Test plugin with default options in example build with tsup", () => {
  const exampleBuildDir = path.resolve(process.cwd(), "..", "packages", "shared", "dist");

  test(`"use client"; directive should be present in client components`, ({ expect }) => {
    const text = fs.readFileSync(path.resolve(exampleBuildDir, "client", "index.js"), "utf-8");
    expect(/^"use client";\n/m.test(text)).toBe(true);
  });

  test(`"use client"; directive should not be present in server components`, ({ expect }) => {
    const text = fs.readFileSync(path.resolve(exampleBuildDir, "server", "index.js"), "utf-8");
    expect(/^"use client";\n/m.test(text)).toBe(false);
  });

  test(`should not contain data-testid`, ({ expect }) => {
    const text = fs.readFileSync(path.resolve(exampleBuildDir, "client", "index.js"), "utf-8");
    expect(/data-testid/.test(text)).toBe(false);
  });
});
