import type { BaseQuestion, FilterSettings } from "../domain/types";

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function filterQuestions<Question extends BaseQuestion>(
  questions: Question[],
  filter: FilterSettings,
  usedQuestionIds: string[],
): Question[] {
  const used = new Set(usedQuestionIds);
  const filtered = questions.filter((question) => {
    if (!question.enabled) return false;
    if (filter.verifiedOnly && !question.verified) return false;
    if (question.difficulty < filter.difficultyMin || question.difficulty > filter.difficultyMax) return false;
    if (filter.category && question.category !== filter.category) return false;
    if (filter.tags.length && !filter.tags.every((tag) => question.tags?.includes(tag))) return false;
    if (filter.excludeUsedQuestions && used.has(question.id)) return false;
    return true;
  });

  return filter.questionOrder === "random" ? shuffle(filtered) : filtered;
}
