import fs from "node:fs";
import path from "node:path";
import { describe, test, beforeAll } from "vitest";
import esbuild from "esbuild";
import react18Plugin from "../src";
import glob from "tiny-glob";

describe.concurrent("Test plugin with ignorePatterns -- without content pattern", async () => {
	const outDir = "ignore-patterns-0";
	const exampleBuildDir = path.resolve(process.cwd(), "test-build", outDir);
	try {
		fs.unlinkSync(path.resolve(exampleBuildDir));
	} catch {}
	beforeAll(async () => {
		await esbuild.build({
			format: "cjs",
			target: "es2019",
			sourcemap: false,
			bundle: true,
			minify: true,
			plugins: [react18Plugin({ ignorePatterns: [{ pathPattern: /star-me/ }] })],
			entryPoints: await glob("../packages/esbuild-plugin-react18-example/src/**/*.*"),
			publicPath: "https://my.domain/static/",
			external: ["react", "react-dom"],
			outdir: "./test-build/" + outDir,
		});
	});

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

/**
 * When content pattern is provided only the ignorePattern files having content matching the content pattern will be removed
 */
describe.concurrent("Test plugin with ignorePatterns with content pattern", async () => {
	const outDir = "ignore-patterns-1";
	beforeAll(async () => {
		await esbuild.build({
			format: "cjs",
			target: "es2019",
			sourcemap: false,
			bundle: true,
			minify: true,
			plugins: [
				react18Plugin({
					ignorePatterns: [{ pathPattern: /star-me/, contentPatterns: [/ignore-me/] }],
				}),
			],
			entryPoints: await glob("../packages/esbuild-plugin-react18-example/src/**/*.*"),
			publicPath: "https://my.domain/static/",
			external: ["react", "react-dom"],
			outdir: "./test-build/" + outDir,
		});
	});

	const exampleBuildDir = path.resolve(process.cwd(), "test-build", outDir);
	test(`star-me.tsx file should exist`, ({ expect }) => {
		expect(fs.existsSync(path.resolve(exampleBuildDir, "client", "star-me", "star-me.js"))).toBe(
			true,
		);
	});
	test(`ignore-me.ts file should not exist as it contains content "ignore-me" (Note: path pattern is still star-me)`, ({
		expect,
	}) => {
		expect(fs.existsSync(path.resolve(exampleBuildDir, "client", "star-me", "ignore-me.js"))).toBe(
			false,
		);
	});
});
