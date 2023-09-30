---
"esbuild-plugin-react18": patch
---

remove data-testid as last item in sourceReplacePatterns. This will reduce the onLoad conflicts significantly as this pattern matches all the js, ts, jsx and tsx files.
