import { describe, expect, it } from "vitest";
import { parseQuestionSource } from "./contentParser";

describe("question bundle parser", () => {
  it("returns structured file, index, id, path, and code for invalid questions", () => {
    const bundle = parseQuestionSource({
      profile: "fixture",
      modules: {
        "/fixture.json": [{ id: "broken", gameType: "logo_quiz", answer: "정답" }],
      },
    });
    expect(bundle.questions).toEqual([]);
    expect(bundle.loadIssues[0]).toMatchObject({
      file: "/fixture.json",
      index: 0,
      questionId: "broken",
      code: "INVALID_UNION",
    });
    expect(bundle.loadIssues.every((issue) => typeof issue.path === "string" && issue.path.length > 0)).toBe(true);
  });

  it("rejects a non-array JSON root without preventing other files from loading", () => {
    const valid = {
      id: "valid-charades",
      gameType: "charades",
      answer: "박수",
      acceptedAnswers: ["박수"],
      category: "fixture",
      difficulty: 1,
      enabled: true,
      verified: true,
    };
    const bundle = parseQuestionSource({ profile: "fixture", modules: { "/bad.json": {}, "/good.json": [valid] } });
    expect(bundle.questions.map((question) => question.id)).toEqual(["valid-charades"]);
    expect(bundle.loadIssues).toEqual([{ file: "/bad.json", code: "INVALID_FILE_ROOT", message: "최상위 값은 배열이어야 합니다." }]);
  });
});
