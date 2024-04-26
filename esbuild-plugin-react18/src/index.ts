import type { BuildResult, OnLoadResult, Plugin, PluginBuild } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { testPathRegExp, name, ignoreNamespace, keepNamespace } from "./constants";

interface ignorePattern {
	pathPattern: RegExp;
	contentPatterns?: RegExp[];
}

interface ReplacePattern {
	pathPattern: RegExp;
	replaceParams: { pattern: RegExp; substitute: string }[];
}

interface React18PluginOptions {
	/** to not ignore tese files */
	keepTests?: boolean;

	/** to not remove `data-testid` attributes. If `keepTests` is true,
	 * `data-testid` attributes will not be removed irrespective of
	 * `keepTestIds` value.
	 * This attribute is useful when setting `sourceReplacePatterns`
	 */
	keepTestIds?: boolean;

	/**
	 * regExp patterns to match file paths to be ignored.
	 * If contentPatterns are provided, only the files at matching paths
	 * containing one or more of the content patterns will be ignored
	 */
	ignorePatterns?: ignorePattern[];

	/**
	 * regExp patterns to find and replace in source files before build
	 *
	 * Use with caution! Make sure same file do not match multiple patterns
	 * to avoid any unexpected results.
	 *
	 * Caution! - if you have not enabled `keepTests`, we are already using
	 * `/.*\.(j|t)s(x)?$/` pattern to remove `data-testid` attributes. If your
	 * `sourceReplacePatterns` collide with these files, please set `keepTestIds`
	 * to `true` and handle removing testsids yourself.
	 */
	sourceReplacePatterns?: ReplacePattern[];

	/**
	 * regExp patterns to find and replace in build files after build
	 * Use with caution! Make sure same file do not match multiple patterns
	 * to avoid any unexpected results.
	 */
	buildReplacePatterns?: ReplacePattern[];
}

function removeTests(build: PluginBuild, options: React18PluginOptions) {
	build.onResolve({ filter: testPathRegExp }, args => ({
		path: args.path,
		namespace: ignoreNamespace,
	}));
	if (!options.keepTestIds) {
		/** remove data-testid */
		if (!options.sourceReplacePatterns) options.sourceReplacePatterns = [];
		options.sourceReplacePatterns.push({
			pathPattern: /.*\.(j|t)s(x)?$/,
			replaceParams: [{ pattern: /\s*data-testid="[^"]*"/gm, substitute: " " }],
		});
	}
}

function ignoreFiles(ignorePattern: ignorePattern, build: PluginBuild) {
	build.onResolve({ filter: ignorePattern.pathPattern }, args => {
		/** remove content to avoid building/transpiling test files unnecessarily*/
		const fullPath = path.resolve(args.resolveDir, args.path);
		if (!ignorePattern.contentPatterns?.length || !fs.existsSync(fullPath))
			return { path: args.path, namespace: ignoreNamespace };

		if (fs.lstatSync(fullPath).isDirectory()) return { path: fullPath, namespace: keepNamespace };

		const text = fs.readFileSync(fullPath, "utf8");
		for (const contentPattern of ignorePattern.contentPatterns)
			if (contentPattern.test(text)) return { path: args.path, namespace: ignoreNamespace };

		return { path: fullPath, namespace: keepNamespace };
	});
}

function replacePatterns({ replaceParams }: ReplacePattern, text: string) {
	replaceParams.forEach(({ pattern, substitute }) => {
		text = text.replace(pattern, substitute);
	});
	return text;
}

function replaceSource(sourceReplacePattern: ReplacePattern, build: PluginBuild) {
	if (sourceReplacePattern.replaceParams.length === 0) return;
	/** Add namespace file to avoid conflict with ignored files */
	build.onLoad({ filter: sourceReplacePattern.pathPattern, namespace: "file" }, args => {
		let text = fs.readFileSync(args.path, "utf8");
		/** todo: test if loader is a valid OnLoadResult.loader
		 * If it is not a valid loader error will be thrown
		 */
		const loader = args.path.slice(args.path.lastIndexOf(".") + 1);
		const contents = replacePatterns(sourceReplacePattern, text);
		return { contents, loader } as OnLoadResult;
	});
}

function replaceBuild(buildReplacePattern: ReplacePattern, result: BuildResult) {
	result.outputFiles
		?.filter(f => buildReplacePattern.pathPattern.test(f.path))
		.forEach(
			f => (f.contents = new TextEncoder().encode(replacePatterns(buildReplacePattern, f.text))),
		);
}

function onEndCallBack(result: BuildResult, options: React18PluginOptions, write?: boolean) {
	/** fix use client and use server*/
	result.outputFiles
		?.filter(f => !f.path.endsWith(".map"))
		.forEach(f => {
			let txt = f.text;
			txt = txt.replace(
				/^(["']use strict["'];)?["']use client["'];?/i,
				'"use client";\n"use strict";',
			);

			/** module level use server */
			txt = txt.replace(
				/^(["']use strict["'];)?["']use server["'];?/i,
				'"use server";\n"use strict";',
			);

			f.contents = new TextEncoder().encode(txt);
		});

	/** handle buildReplacePatterns */
	options.buildReplacePatterns?.forEach(replacePattern => replaceBuild(replacePattern, result));

	/** Do not generate {empty} test files if keepTests is not set to true */
	if (!options.keepTests) {
		result.outputFiles = result.outputFiles?.filter(f => !testPathRegExp.test(f.path));
	}

	/** remove empty files */
	// result.outputFiles = result.outputFiles?.filter(f => f.text.trim() !== "");
	/** assume true if undefined */
	if (write === undefined || write) {
		result.outputFiles?.forEach(file => {
			fs.mkdirSync(path.dirname(file.path), { recursive: true });
			fs.writeFileSync(file.path, file.contents);
		});
	}
}

function setup(build: PluginBuild, options: React18PluginOptions = {}) {
	const write = build.initialOptions.write;
	build.initialOptions.write = false;

	if (!options.keepTests) removeTests(build, options);

	options.ignorePatterns?.forEach(ignorePattern => ignoreFiles(ignorePattern, build));

	options.sourceReplacePatterns?.forEach(replacePattern => replaceSource(replacePattern, build));

	build.onLoad({ filter: /.*/, namespace: ignoreNamespace }, () => {
		/** remove content to avoid building/transpiling ignored files*/
		return { contents: "" };
	});

	build.onLoad({ filter: /.*/, namespace: keepNamespace }, args => {
		if (fs.existsSync(args.path) && fs.lstatSync(args.path).isDirectory()) return { contents: "" };
		else {
			const loader = args.path.slice(args.path.lastIndexOf(".") + 1);
			return { contents: fs.readFileSync(args.path, "utf-8"), loader } as OnLoadResult;
		}
	});

	build.onEnd(result => onEndCallBack(result, options, write));
}

/** This plugin prevents building test files by esbuild. DTS may still geenrate type files for the tests with only { } as file content*/
const react18Plugin: (options?: React18PluginOptions) => Plugin = (options = {}) => ({
	name,
	setup: build => setup(build, options),
});

export = react18Plugin;
