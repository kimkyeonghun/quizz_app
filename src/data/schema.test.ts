import { describe, expect, it } from "vitest";
import { mvpQuestionSchema } from "./schema";

describe("mvpQuestionSchema", () => {
  it("게임별 metadata가 올바른 문제를 허용한다", () => {
    const result = mvpQuestionSchema.safeParse({
      id: "hint_test",
      gameType: "progressive_hint",
      answer: "정답",
      acceptedAnswers: ["정답"],
      category: "test",
      difficulty: 1,
      enabled: true,
      verified: true,
      metadata: { hints: ["첫 힌트", "둘째 힌트"] },
    });
    expect(result.success).toBe(true);
  });

  it("필수 metadata와 알 수 없는 최상위 속성을 거부한다", () => {
    expect(mvpQuestionSchema.safeParse({
      id: "broken",
      gameType: "four_syllable",
      answer: "정답",
      category: "test",
      difficulty: 1,
      enabled: true,
      verified: true,
    }).success).toBe(false);

    expect(mvpQuestionSchema.safeParse({
      id: "extra",
      gameType: "charades",
      answer: "정답",
      category: "test",
      difficulty: 1,
      enabled: true,
      verified: true,
      typoField: true,
    }).success).toBe(false);
  });
});
