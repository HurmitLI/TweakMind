import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Core modules read window.localStorage / sessionStorage at call time,
    // so tests run in a DOM-like environment instead of plain node.
    environment: "jsdom",
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
    clearMocks: true
  }
});
