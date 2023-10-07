import { OnLoadResult, Plugin } from "esbuild";
import fs from "node:fs";
import path from "node:path";

type React18PluginOptions = {
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
	ignorePatterns?: { pathPattern: RegExp; contentPatterns?: RegExp[] }[];

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
	sourceReplacePatterns?: {
		pathPattern: RegExp;
		replaceParams: { pattern: RegExp; substitute: string }[];
	}[];

	/**
	 * regExp patterns to find and replace in build files after build
	 * Use with caution! Make sure same file do not match multiple patterns
	 * to avoid any unexpected results.
	 */
	buildReplacePatterns?: {
		pathPattern: RegExp;
		replaceParams: { pattern: RegExp; substitute: string }[];
	}[];
};

/** This plugin prevents building test files by esbuild. DTS may still geenrate type files for the tests with only { } as file content*/
const react18Plugin: (options?: React18PluginOptions) => Plugin = (options = {}) => ({
	name: "esbuild-plugin-react18-" + uuid(),
	setup(build) {
		const ignoreNamespace = "mayank1513-ignore-" + uuid();
		const keepNamespace = "mayank1513-keep-" + uuid();
		const testPathRegExp = /.*\.(test|spec|check)\.(j|t)s(x)?$/i;

		const write = build.initialOptions.write;
		build.initialOptions.write = false;

		if (!options.keepTests) {
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

		options.ignorePatterns?.forEach(ignorePattern => {
			build.onResolve({ filter: ignorePattern.pathPattern }, args => {
				/** remove content to avoid building/transpiling test files unnecessarily*/
				const fullPath = path.resolve(args.resolveDir, args.path);
				if (!ignorePattern.contentPatterns?.length || !fs.existsSync(fullPath))
					return { path: args.path, namespace: ignoreNamespace };

				if (!fs.lstatSync(fullPath).isDirectory()) {
					const text = fs.readFileSync(fullPath, "utf8");
					for (const contentPattern of ignorePattern.contentPatterns) {
						if (contentPattern.test(text)) {
							return { path: args.path, namespace: ignoreNamespace };
						}
					}
				}
				return { path: fullPath, namespace: keepNamespace };
			});
		});

		options.sourceReplacePatterns?.forEach(sourceReplacePattern => {
			if (sourceReplacePattern.replaceParams.length === 0) return;
			/** Add namespace file to avoid conflict with ignored files */
			build.onLoad({ filter: sourceReplacePattern.pathPattern, namespace: "file" }, args => {
				let contents = fs.readFileSync(args.path, "utf8");
				/** todo: test if loader is a valid OnLoadResult.loader
				 * If it is not a valid loader error will be thrown
				 */
				const loader = args.path.slice(args.path.lastIndexOf(".") + 1);
				sourceReplacePattern.replaceParams.forEach(({ pattern, substitute }) => {
					contents = contents.replace(pattern, substitute);
				});
				return { contents, loader } as OnLoadResult;
			});
		});

		build.onLoad({ filter: /.*/, namespace: ignoreNamespace }, args => {
			/** remove content to avoid building/transpiling test files unnecessarily*/
			return { contents: "" };
		});

		build.onLoad({ filter: /.*/, namespace: keepNamespace }, args => {
			if (fs.existsSync(args.path) && fs.lstatSync(args.path).isDirectory())
				return { contents: "" };
			else {
				const loader = args.path.slice(args.path.lastIndexOf(".") + 1);
				return { contents: fs.readFileSync(args.path, "utf-8"), loader } as OnLoadResult;
			}
		});

		const useClientRegExp = /['"]use client['"]\s?;/i;

		build.onEnd(result => {
			result.outputFiles
				?.filter(f => !f.path.endsWith(".map"))
				.forEach(f => {
					const txt = f.text;
					if (txt.match(useClientRegExp)) {
						const text = '"use client";\n' + txt.replace(useClientRegExp, "");
						f.contents = new TextEncoder().encode(text);
					}
				});

			/** handle buildReplacePatterns */
			options.buildReplacePatterns?.forEach(buildReplacePattern => {
				result.outputFiles
					?.filter(f => buildReplacePattern.pathPattern.test(f.path))
					.forEach(f => {
						let text = f.text;
						buildReplacePattern.replaceParams.forEach(({ pattern, substitute }) => {
							text = text.replace(pattern, substitute);
						});
						f.contents = new TextEncoder().encode(text);
					});
			});

			/** Do not generate {empty} test files if keepTests is not set to true */
			if (!options.keepTests) {
				result.outputFiles = result.outputFiles?.filter(f => !testPathRegExp.test(f.path));
			}

			/** remove empty files */
			result.outputFiles = result.outputFiles?.filter(f => f.text !== "");
			/** assume true if undefined */
			if (write === undefined || write) {
				result.outputFiles?.forEach(file => {
					fs.mkdirSync(path.dirname(file.path), { recursive: true });
					fs.writeFileSync(file.path, file.contents);
				});
			}
		});
	},
});

const uuid = () => (Date.now() * Math.random()).toString(36).slice(0, 8);

export = react18Plugin;
