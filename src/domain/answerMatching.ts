import type { PlayableQuestion } from "./types";

export function answerMatchesQuestion(question: PlayableQuestion, guess: string): boolean {
  if (!question.answer) return false;
  const accepted = [question.answer, ...(question.acceptedAnswers ?? [])];
  if (question.gameType === "four_syllable") accepted.push(question.metadata.fullAnswer);
  const normalizedGuess = normalizeAnswer(guess);
  return normalizedGuess.length > 0 && accepted.some((answer) => normalizeAnswer(answer) === normalizedGuess);
}

function normalizeAnswer(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("ko-KR").replace(/[^\p{L}\p{N}]/gu, "");
}
