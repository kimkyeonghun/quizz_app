import type { PlayableQuestion, PlayableGameType } from "../domain/types";
import { questionSource } from "#question-source";
import { parseQuestionSource } from "./contentParser";
import { formatContentIssue } from "./contentTypes";

export const questionBundle = parseQuestionSource(questionSource);
export const questions = questionBundle.questions;
export const questionLoadIssues = questionBundle.loadIssues;
export const questionLoadErrors = questionLoadIssues.map(formatContentIssue);

export function questionsForGame(gameType: PlayableGameType): PlayableQuestion[] {
  return questions.filter((question) => question.gameType === gameType);
}
