import fs from "node:fs";
import path from "node:path";
import { describe, test } from "vitest";

describe.concurrent("Test plugin with default options", () => {
	const exampleBuildDir = path.resolve(
		process.cwd(),
		"..",
		"esbuild-plugin-react18-example",
		"dist",
	);
	console.log({ exampleBuildDir });
	test(`"use client"; directive should be present in client components`, ({ expect }) => {
		const text = fs.readFileSync(path.resolve(exampleBuildDir, "client", "index.js"), "utf-8");
		expect(/^"use client";\n/m.test(text)).toBe(true);
	});
	test(`"use client"; directive should not be present in server components`, ({ expect }) => {
		const text = fs.readFileSync(path.resolve(exampleBuildDir, "server", "index.js"), "utf-8");
		expect(/^"use client";\n/m.test(text)).toBe(false);
	});
});
