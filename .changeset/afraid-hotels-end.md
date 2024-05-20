---
"esbuild-plugin-react18": patch
---

Add option to disableJSXRequireDedup.

In case you face any errors, or you want to speed up build a bit, try disabling deduplication of require("react/jsx-runtime")
