import { OnLoadResult, Plugin } from "esbuild";
import fs from "node:fs";
import path from "node:path";

type react18PluginOptions = {
	/** do not ignore tese files */
	keepTests?: boolean;
	/**
	 * regExp patterns to match file paths to be ignored.
	 * If contentPatterns are provided, only the files at matching paths
	 * containing one or more of the content patterns will be ignored
	 */
	ignorePathPatterns?: { pattern: RegExp; contentPatterns?: RegExp[] }[];
};

/** This plugin prevents building test files by esbuild. DTS may still geenrate type files for the tests with only { } as file content*/
const react18Plugin: (options?: react18PluginOptions) => Plugin = options => ({
	name: "esbuild-plugin-react18-" + uuid(),
	setup(build) {
		const ignoreNamespace = "mayank1513-ignore-" + uuid();
		const testPathRegExp = /.*\.(test|spec|check)\..*/i;
		if (!options?.keepTests) {
			build.onResolve({ filter: testPathRegExp }, args => ({
				path: args.path,
				namespace: ignoreNamespace,
			}));
			/** remove data-testid */
			// build.onLoad({ filter: /.*\.(j|t)s(x)?$/, namespace: "file" }, args => {
			// 	const text = fs.readFileSync(args.path, "utf8");
			// 	const loader = args.path.slice(args.path.lastIndexOf(".") + 1);
			// 	return { contents: text.replace(/\s*data-testid="[^"]*"/gm, " "), loader } as OnLoadResult;
			// });
		}

		options?.ignorePathPatterns?.forEach(pathPattern => {
			build.onResolve({ filter: pathPattern.pattern }, args => {
				/** remove content to avoid building/transpiling test files unnecessarily*/
				if (!pathPattern.contentPatterns?.length)
					return {
						path: args.path,
						namespace: ignoreNamespace,
					};
				const text = fs.readFileSync(path.resolve(args.resolveDir, args.path), "utf8");
				for (const pattern of pathPattern.contentPatterns) {
					if (pattern.test(text)) {
						return {
							path: args.path,
							namespace: ignoreNamespace,
						};
					}
				}
				return { path: args.path };
			});
		});

		build.onLoad({ filter: /.*/, namespace: ignoreNamespace }, args => {
			/** remove content to avoid building/transpiling test files unnecessarily*/
			console.log("onLoad", args);
			return { contents: "" };
		});

		const useClientRegExp = /['"]use client['"]\s?;/i;

		build.onEnd(result => {
			result.outputFiles
				?.filter(f => !f.path.endsWith(".map"))
				.forEach(f => {
					const txt = f.text;
					if (txt.match(useClientRegExp)) {
						Object.defineProperty(f, "text", {
							value: '"use client";\n' + txt.replace(useClientRegExp, ""),
						});
					}
				});
			if (!options?.keepTests) {
				result.outputFiles = result.outputFiles?.filter(f => !testPathRegExp.test(f.path));
			}
		});
	},
});

const uuid = () => (Date.now() * Math.random()).toString(36).slice(0, 8);

export = react18Plugin;
