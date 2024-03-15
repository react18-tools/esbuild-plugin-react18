const uuid = () => (Date.now() * Math.random()).toString(36).slice(0, 8);

/** regExp */
export const testPathRegExp = /.*\.(test|spec|check)\.(j|t)s(x)?$/i;
export const useClientRegExp = /['"]use client['"]\s?;/i;
export const useServerRegExp = /['"]use server['"]\s?;/i;

export const name = "esbuild-plugin-react18-" + uuid();
export const ignoreNamespace = "mayank1513-ignore-" + uuid();
export const keepNamespace = "mayank1513-keep-" + uuid();
