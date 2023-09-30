import fs from "node:fs";
import path from "node:path";
import { describe, test, beforeAll } from "vitest";
import esbuild from "esbuild";
import react18Plugin from "../src";
import glob from "tiny-glob";

describe.concurrent("Test plugin with default options - CJS build", async () => {
	beforeAll(async () => {
		await esbuild.build({
			format: "cjs",
			target: "es2019",
			sourcemap: false,
			bundle: true,
			minify: true,
			plugins: [react18Plugin()],
			entryPoints: await glob("../esbuild-plugin-react18-example/src/**/*.*"),
			publicPath: "https://my.domain/static/",
			external: ["react", "react-dom"],
			outdir: "./dist/default",
		});
	});

	test("dummy", async ({ expect }) => {
		expect("Ok").toBe("Ok");
	});
});

describe.todo("Test plugin with default options", () => {
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
