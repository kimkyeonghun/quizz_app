import { describe, expect, it } from "vitest";
import type { PlayableQuestion } from "../domain/types";
import { preflightQuestions } from "./mediaPreflight";

const questions = [
  { id: "text", gameType: "charades", answer: "텍스트", category: "fixture", difficulty: 1, enabled: true, verified: true },
  { id: "good", gameType: "song_drawing", answer: "정상", acceptedAnswers: ["정상"], category: "fixture", difficulty: 1, enabled: true, verified: true, asset: "/good.svg", metadata: { artist: "가수", visualStyle: "ADULT_SKETCH", license: "ORIGINAL", credit: "fixture" } },
  { id: "bad", gameType: "song_drawing", answer: "실패", acceptedAnswers: ["실패"], category: "fixture", difficulty: 1, enabled: true, verified: true, asset: "/bad.svg", metadata: { artist: "가수", visualStyle: "ADULT_SKETCH", license: "ORIGINAL", credit: "fixture" } },
] as PlayableQuestion[];

describe("media preflight", () => {
  it("keeps text questions and removes only failed media questions", async () => {
    const result = await preflightQuestions(questions, async (question) => {
      if (question.id === "bad") throw new Error("fixture failure");
    });
    expect(result.playable.map((question) => question.id)).toEqual(["text", "good"]);
    expect(result.failures).toEqual([{ questionId: "bad", asset: "/bad.svg", message: "fixture failure" }]);
  });
});
