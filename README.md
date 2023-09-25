# esbuild-plugin-react18 [![test](https://github.com/mayank1513/esbuild-plugin-react18/actions/workflows/test.yml/badge.svg)](https://github.com/mayank1513/esbuild-plugin-react18/actions/workflows/test.yml) [![Version](https://img.shields.io/npm/v/esbuild-plugin-react18.svg?colorB=green)](https://www.npmjs.com/package/esbuild-plugin-react18) [![Downloads](https://img.jsdelivr.com/img.shields.io/npm/dt/esbuild-plugin-react18.svg)](https://www.npmjs.com/package/esbuild-plugin-react18) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/esbuild-plugin-react18)

<img src="esbuild-react18.jpg" title="Build Awesome Libraries using React Server Components and make your Mark!" style="width:100%"/>

> Build Awesome Libraries using React Server Components and make your Mark!

This is an `esbuild` plugin for compiling libraries compatible with React 18 server and client component, Nextjs13, Remix, etc.

## Why?

✅ Unleash the full power of React18 Server components

✅ Build libraries for all build systems/tools/frameworks supporting React18

✅ Unleash the power of combining react client and server components in your libraries

✅ Full TypeScript support out of the box

✅ Simple and tiny

✅ Easy to use — just add the plugin, and you are good to go

✅ All in one plugin for building react18 libraries with `tsup` or `esbuild`

✅ add "use client" directive to indicate client component and the plugin will do the rest

✅ Automatically ignore test files during build

✅ Automatically remove `data-testid` attributes

✅ Add `ignorePatterns` and `replacePatterns` to achieve much more control over your build

✅ Fully Documented

✅ Ready to use [GitHub repository template](https://github.com/mayank1513/turborepo-template) to create your next react18 library

Introduction of React server components in React 18 has unlocked immense possibilities. However, library authors are not yet able to fully encash upon this potential. Many libraries, like `chakra-ui`, simply add “use client” for each component. However, much more can be unleashed when we can use both server and client components to build libraries. Also check-out this [blog](https://mayank1513.medium.com/unleash-the-power-of-react-server-components-eb3fe7201231).

## Compatibility

- JavaScript/TypeScript React libraries using `tsup` or other builders based on `esbuild`

This plugin seamlessly integrates with `tsup` and any other builders based on `esbuild`. With this you can have both server and client components in your library and the plugin will take care of the rest. All you need to do is add this plugin and add `"use client";` on top of client components (in your source code). Additionally, test files will be removed automatically from the build resulting in smaller package. Explore more functionalities in the docs.

## Install

```bash
yarn add --dev esbuild-react18-useclient
```

or

```bash
pnpm add -D esbuild-react18-useclient
```

or

```bash
npm install -D esbuild-react18-useclient
```

> If you are using `monorepo` or `workspaces` you can install this plugin to root using `-w` or to specific workspace using `--filter your-package` or `--scope your-package` for `pnpm` and `yarn` workspaces respectively.

## Simplatest use with `tsup`

```javascript
// tsup.config.ts or tsup.config.js
import { defineConfig } from "tsup";
import react18Plugin from "esbuild-react18-useclient";

const react18PluginOptions: React18PluginOptions = {}
export default defineConfig(options => ({
    ...
    esbuildPlugins:[react18Plugin(react18PluginOptions)]
}));
```

## Plugin Options

```ts
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
```

### 🤩 Don't forger to start this repo!

Want handson course for getting started with Turborepo? Check out [React and Next.js with TypeScript](https://www.udemy.com/course/react-and-next-js-with-typescript/?referralCode=7202184A1E57C3DCA8B2) and [The Game of Chess with Next.js, React and TypeScrypt](https://www.udemy.com/course/game-of-chess-with-nextjs-react-and-typescrypt/?referralCode=851A28F10B254A8523FE)

## License

Licensed as MIT open source.

<hr />

<p align="center" style="text-align:center">with 💖 by <a href="https://mayank-chaudhari.vercel.app" target="_blank">Mayank Kumar Chaudhari</a></p>
