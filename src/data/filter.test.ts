import { describe, expect, it, vi } from "vitest";
import type { FilterSettings, MvpQuestion } from "../domain/types";
import { filterQuestions, shuffle } from "./filter";

const questions = [
  { id: "one", gameType: "charades", answer: "축구", acceptedAnswers: ["축구"], category: "sports", tags: ["ball"], difficulty: 1, enabled: true, verified: true },
  { id: "two", gameType: "charades", answer: "수영", acceptedAnswers: ["수영"], category: "sports", tags: ["water"], difficulty: 3, enabled: true, verified: false },
  { id: "three", gameType: "charades", answer: "독서", acceptedAnswers: ["독서"], category: "daily", difficulty: 2, enabled: false, verified: true },
] as MvpQuestion[];

const baseFilter: FilterSettings = {
  difficultyMin: 1,
  difficultyMax: 5,
  category: "",
  tags: [],
  verifiedOnly: true,
  excludeUsedQuestions: true,
  questionOrder: "data",
};

describe("filterQuestions", () => {
  it("활성·검증·카테고리·사용 기록을 함께 적용한다", () => {
    expect(filterQuestions(questions, baseFilter, []).map((question) => question.id)).toEqual(["one"]);
    expect(filterQuestions(questions, { ...baseFilter, verifiedOnly: false }, ["one"]).map((question) => question.id)).toEqual(["two"]);
    expect(filterQuestions(questions, { ...baseFilter, verifiedOnly: false, excludeUsedQuestions: false, tags: ["water"] }, []).map((question) => question.id)).toEqual(["two"]);
  });

  it("Fisher-Yates 방식으로 원본을 변경하지 않고 섞는다", () => {
    const random = vi.fn().mockReturnValue(0);
    const source = [1, 2, 3];
    expect(shuffle(source, random)).toEqual([2, 3, 1]);
    expect(source).toEqual([1, 2, 3]);
  });
});
