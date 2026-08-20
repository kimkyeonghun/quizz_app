import type { NewGameId } from "./contracts";
import { newGameQuestionSchema, type NewGameQuestion } from "./questionSchemas";

const modules = import.meta.glob("/data/{music-intro,zoom-image,logo-quiz,movie-poster,song-drawing,taboo}/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const parsedQuestions: NewGameQuestion[] = [];
const loadErrors: string[] = [];

for (const [path, content] of Object.entries(modules)) {
  if (!Array.isArray(content)) {
    loadErrors.push(`${path}: 최상위 값은 배열이어야 합니다.`);
    continue;
  }

  content.forEach((item, index) => {
    const result = newGameQuestionSchema.safeParse(item);
    if (result.success) parsedQuestions.push(result.data);
    else loadErrors.push(`${path}[${index}]: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ")}`);
  });
}

export const newGameQuestions = parsedQuestions;
export const newGameQuestionLoadErrors = loadErrors;

export function newQuestionsForGame(gameType: NewGameId): NewGameQuestion[] {
  return newGameQuestions.filter((question) => question.gameType === gameType);
}
