import type { MvpQuestion } from "../domain/types";
import { mvpQuestionSchema } from "./schema";

const modules = import.meta.glob("/data/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const parsedQuestions: MvpQuestion[] = [];
const loadErrors: string[] = [];

for (const [path, content] of Object.entries(modules)) {
  if (!Array.isArray(content)) {
    loadErrors.push(`${path}: 최상위 값은 배열이어야 합니다.`);
    continue;
  }

  content.forEach((item, index) => {
    const result = mvpQuestionSchema.safeParse(item);
    if (result.success) {
      parsedQuestions.push(result.data as MvpQuestion);
    } else {
      loadErrors.push(`${path}[${index}]: ${result.error.issues.map((issue) => issue.message).join(", ")}`);
    }
  });
}

export const questions = parsedQuestions;
export const questionLoadErrors = loadErrors;

export function questionsForGame(gameType: string): MvpQuestion[] {
  return questions.filter((question) => question.gameType === gameType);
}
