import type { QuestionSourceModule } from "../data/contentTypes";

const modules = import.meta.glob(["/tests/fixtures/data/**/*.json", "!/tests/fixtures/data/content-manifest.json"], {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

export const questionSource: QuestionSourceModule = {
  profile: "fixture",
  modules,
};
