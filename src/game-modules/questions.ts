import type { NewGameId } from "./contracts";
import { questionLoadErrors, questions } from "../data/questions";
import { isNewGameId } from "./registry";
import type { NewGameQuestion } from "./questionSchemas";

export const newGameQuestions = questions.filter(
  (question): question is NewGameQuestion => isNewGameId(question.gameType),
);
export const newGameQuestionLoadErrors = questionLoadErrors;

export function newQuestionsForGame(gameType: NewGameId): NewGameQuestion[] {
  return newGameQuestions.filter((question) => question.gameType === gameType);
}
