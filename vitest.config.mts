import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // "server-only" throws outside the React server bundle; tests run in plain Node.
      "server-only": fileURLToPath(new URL("./test/empty.ts", import.meta.url)),
    },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
