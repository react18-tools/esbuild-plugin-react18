import fs from "node:fs";
import path from "node:path";
import { describe, test, beforeAll } from "vitest";
import esbuild from "esbuild";
import react18Plugin from "../src";
import glob from "tiny-glob";

describe.concurrent("Test plugin with ignorePatterns -- without content pattern", async () => {
	beforeAll(async () => {
		await esbuild.build({
			format: "cjs",
			target: "es2019",
			sourcemap: false,
			bundle: true,
			minify: true,
			plugins: [react18Plugin({ ignorePatterns: [{ pathPattern: /star-me/ }] })],
			entryPoints: await glob("../esbuild-plugin-react18-example/src/**/*.*"),
			publicPath: "https://my.domain/static/",
			external: ["react", "react-dom"],
			outdir: "./dist/default",
		});
	});

	const exampleBuildDir = path.resolve(process.cwd(), "dist", "default");
	test(`"use client"; directive should be present in client components`, ({ expect }) => {
		const text = fs.readFileSync(path.resolve(exampleBuildDir, "client", "index.js"), "utf-8");
		expect(/^"use client";\n/m.test(text)).toBe(true);
	});
	test(`"use client"; directive should not be present in server components`, ({ expect }) => {
		const text = fs.readFileSync(path.resolve(exampleBuildDir, "server", "index.js"), "utf-8");
		expect(/^"use client";\n/m.test(text)).toBe(false);
	});
	test(`star-me.tsx file should not exist`, ({ expect }) => {
		expect(fs.existsSync(path.resolve(exampleBuildDir, "client", "star-me"))).toBe(false);
	});
});
