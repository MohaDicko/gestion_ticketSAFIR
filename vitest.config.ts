import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 20000,
    include: ["tests/vitest/**/*.test.ts", "tests/owasp-zap/**/*.test.ts"],
  },
});
