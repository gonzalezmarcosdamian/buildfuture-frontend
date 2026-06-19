import { defineConfig } from "vitest/config";

// Unit tests (vitest) usan *.test.ts. Los E2E de Playwright usan e2e/*.spec.ts
// y quedan excluidos acá para que cada runner corra lo suyo.
export default defineConfig({
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", "e2e/**", "playwright-report/**"],
    environment: "node",
  },
});
