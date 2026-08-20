import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { newGameModules, newGameQuestionSchema } from "./registry";
import { newGameQuestionLoadErrors, newGameQuestions } from "./questions";
import { reduceTabooRuntime, tabooModule } from "./taboo";
import { zoomImageQuestionSchema } from "./zoom-image";

const shared = {
  acceptedAnswers: ["테스트"],
  category: "샘플",
  difficulty: 1 as const,
  enabled: true,
  verified: true,
  source: "직접 제작",
};

describe("new game modules", () => {
  it("registers all six games without importing the session store", () => {
    expect(Object.keys(newGameModules)).toEqual([
      "music_intro",
      "zoom_image",
      "logo_quiz",
      "movie_poster",
      "song_drawing",
      "taboo",
    ]);
  });

  it("loads every bundled sample with the strict module schemas", () => {
    expect(newGameQuestionLoadErrors).toEqual([]);
    expect(newGameQuestions).toHaveLength(74);
    expect(Object.fromEntries(Object.keys(newGameModules).map((gameId) => [gameId, newGameQuestions.filter((question) => question.gameType === gameId).length]))).toEqual({
      music_intro: 6,
      zoom_image: 12,
      logo_quiz: 12,
      movie_poster: 8,
      song_drawing: 6,
      taboo: 30,
    });
  });

  it("rejects unknown metadata fields", () => {
    const result = newGameQuestionSchema.safeParse({
      ...shared,
      id: "logo-test",
      gameType: "logo_quiz",
      answer: "테스트",
      asset: "/assets/sample.svg",
      metadata: { brandCategory: "기술", license: "ORIGINAL", credit: "직접 제작", extra: true },
    });
    expect(result.success).toBe(false);
  });

  it("rejects zoom crops that become smaller", () => {
    const result = zoomImageQuestionSchema.safeParse({
      ...shared,
      id: "zoom-test",
      gameType: "zoom_image",
      answer: "테스트",
      asset: "/assets/sample.svg",
      metadata: {
        crops: [{ x: 0, y: 0, width: 80, height: 80 }, { x: 10, y: 10, width: 20, height: 20 }],
        license: "ORIGINAL",
        credit: "직접 제작",
      },
    });
    expect(result.success).toBe(false);
  });

  it("uses question data for progressive stage counts", () => {
    const result = zoomImageQuestionSchema.parse({
      ...shared,
      id: "zoom-stage-test",
      gameType: "zoom_image",
      answer: "테스트",
      asset: "/assets/sample.svg",
      metadata: {
        crops: [
          { x: 40, y: 40, width: 10, height: 10 },
          { x: 25, y: 25, width: 50, height: 50 },
          { x: 0, y: 0, width: 100, height: 100 },
        ],
        license: "ORIGINAL",
        credit: "직접 제작",
      },
    });
    expect(newGameModules.zoom_image.getStageCount(result, newGameModules.zoom_image.defaultSettings)).toBe(3);
  });

  it("toggles taboo forbidden words through serializable runtime", () => {
    expect(reduceTabooRuntime({ forbiddenWordsVisible: true }, { type: "HIDE_FORBIDDEN" })).toEqual({ forbiddenWordsVisible: false });
    expect(reduceTabooRuntime({ forbiddenWordsVisible: false }, { type: "SHOW_FORBIDDEN" })).toEqual({ forbiddenWordsVisible: true });
  });

  it("renders and hides taboo words using module actions", () => {
    const question = tabooModule.questionSchema.parse({
      ...shared,
      id: "taboo-test",
      gameType: "taboo",
      answer: "테스트",
      asset: null,
      metadata: { forbiddenWords: ["시험", "문제", "확인", "검증"] },
    });
    let runtime = tabooModule.initialRuntime;
    const { rerender } = render(
      <tabooModule.QuestionView question={question} stageIndex={0} revealed={false} runtime={runtime} dispatch={(action) => { runtime = tabooModule.reduceRuntime(runtime, action); }} />,
    );
    expect(screen.getByText("시험")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "숨기기" }));
    rerender(<tabooModule.QuestionView question={question} stageIndex={0} revealed={false} runtime={runtime} dispatch={() => undefined} />);
    expect(screen.queryByText("시험")).not.toBeInTheDocument();
    expect(screen.getByText("금지어 숨김")).toBeInTheDocument();
  });
});
