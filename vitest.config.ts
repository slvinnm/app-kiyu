import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  // NOTE: On Windows an absolute `root` makes every suite fail with
  // "TypeError: Cannot read properties of undefined (reading 'config')".
  root: ".",
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd()),
    },
  },
})
