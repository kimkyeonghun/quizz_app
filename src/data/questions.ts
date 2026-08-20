import type { PlayableQuestion, PlayableGameType } from "../domain/types";
import { questionSchema } from "./schema";

const modules = import.meta.glob("/data/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const parsedQuestions: PlayableQuestion[] = [];
const loadErrors: string[] = [];

for (const [path, content] of Object.entries(modules)) {
  if (!Array.isArray(content)) {
    loadErrors.push(`${path}: 최상위 값은 배열이어야 합니다.`);
    continue;
  }

  content.forEach((item, index) => {
    const result = questionSchema.safeParse(item);
    if (result.success) {
      parsedQuestions.push(result.data as PlayableQuestion);
    } else {
      loadErrors.push(`${path}[${index}]: ${result.error.issues.map((issue) => issue.message).join(", ")}`);
    }
  });
}

export const questions = parsedQuestions;
export const questionLoadErrors = loadErrors;

export function questionsForGame(gameType: PlayableGameType): PlayableQuestion[] {
  return questions.filter((question) => question.gameType === gameType);
}
