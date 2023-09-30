import { OnLoadResult, Plugin } from "esbuild";
import fs from "node:fs";
import path from "node:path";

type React18PluginOptions = {
	/** do not ignore tese files */
	keepTests?: boolean;

	/** do not remove `data-testid` attributes. If `keepTests` is true,
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
const react18Plugin: (options?: React18PluginOptions) => Plugin = options => ({
	name: "esbuild-plugin-react18-" + uuid(),
	setup(build) {
		const ignoreNamespace = "mayank1513-ignore-" + uuid();
		const testPathRegExp = /.*\.(test|spec|check)\.(j|t)s(x)?$/i;

		const write = build.initialOptions.write;
		build.initialOptions.write = false;

		if (!options?.keepTests) {
			build.onResolve({ filter: testPathRegExp }, args => ({
				path: args.path,
				namespace: ignoreNamespace,
			}));
			if (!options?.keepTestIds) {
				/** remove data-testid */
				build.onLoad({ filter: /.*\.(j|t)s(x)?$/, namespace: "file" }, args => {
					const text = fs.readFileSync(args.path, "utf8");
					const loader = args.path.slice(args.path.lastIndexOf(".") + 1);
					return {
						contents: text.replace(/\s*data-testid="[^"]*"/gm, " "),
						loader,
					} as OnLoadResult;
				});
			}
		}

		options?.ignorePatterns?.forEach(ignorePattern => {
			build.onResolve({ filter: ignorePattern.pathPattern }, args => {
				/** remove content to avoid building/transpiling test files unnecessarily*/
				console.log("onResolve - ignore", args);
				if (!ignorePattern.contentPatterns?.length)
					return {
						path: args.path,
						namespace: ignoreNamespace,
					};
				const text = fs.readFileSync(path.resolve(args.resolveDir, args.path), "utf8");
				for (const contentPattern of ignorePattern.contentPatterns) {
					if (contentPattern.test(text)) {
						return {
							path: args.path,
							namespace: ignoreNamespace,
						};
					}
				}
				return { path: args.path };
			});
		});

		options?.sourceReplacePatterns?.forEach(sourceReplacePattern => {
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

		const useClientRegExp = /['"]use client['"]\s?;/i;

		build.onEnd(result => {
			result.outputFiles
				?.filter(f => !f.path.endsWith(".map"))
				.forEach(f => {
					const txt = f.text;
					if (txt.match(useClientRegExp)) {
						const value = '"use client";\n' + txt.replace(useClientRegExp, "");
						f.contents = new TextEncoder().encode(value);
					}
				});

			/** handle buildReplacePatterns */
			options?.buildReplacePatterns?.forEach(buildReplacePattern => {
				result.outputFiles
					?.filter(f => buildReplacePattern.pathPattern.test(f.path))
					.forEach(f => {
						let text = f.text;
						buildReplacePattern.replaceParams.forEach(({ pattern, substitute }) => {
							text = text.replace(pattern, substitute);
						});
						Object.defineProperty(f, "text", { value: text });
					});
			});

			/** Do not generate {empty} test files if keepTests is not set to true */
			if (!options?.keepTests) {
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
