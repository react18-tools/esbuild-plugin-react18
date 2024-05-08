import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: [],
    coverage: {
      include: ["src/**"],
      reporter: ["text", "json", "clover", "html"],
    },
  },
});
