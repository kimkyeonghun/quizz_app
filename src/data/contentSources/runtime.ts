import type { QuestionSourceModule } from "../contentTypes";

const modules = import.meta.glob(["/data/**/*.json", "!/data/content-manifest.json"], {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

export const questionSource: QuestionSourceModule = {
  profile: "production",
  modules,
};
