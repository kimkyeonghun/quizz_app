import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const fixtureMode = mode === "fixture" || mode === "test";
  return {
    base: "./",
    publicDir: fixtureMode ? "tests/fixtures/public" : "public",
    resolve: {
      alias: {
        "#question-source": fileURLToPath(new URL(
          fixtureMode ? "./src/test/fixtureQuestionSource.ts" : "./src/data/contentSources/runtime.ts",
          import.meta.url,
        )),
      },
    },
    plugins: [react()],
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
      include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    },
  };
});
