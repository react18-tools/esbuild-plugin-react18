import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
	test: {
		globals: true,
		setupFiles: [],
		coverage: {
			include: ["src/**"],
			reporter: ["text", "json", "html", "clover"],
		},
	},
});
