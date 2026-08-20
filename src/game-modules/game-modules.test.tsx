import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { newGameModules } from "./registry";
import { newGameQuestionSchema } from "./questionSchemas";
import { newGameQuestionLoadErrors, newGameQuestions } from "./questions";
import { reduceTabooRuntime, tabooModule } from "./taboo";
import { logoQuizQuestionSchema } from "./logo-quiz/schema";
import { moviePosterQuestionSchema } from "./movie-poster/schema";
import { songDrawingQuestionSchema } from "./song-drawing/schema";
import { zoomImageQuestionSchema } from "./zoom-image/schema";

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
    const bundledQuestions = newGameQuestions.filter((question) => !question.id.startsWith("local-"));
    expect(newGameQuestionLoadErrors).toEqual([]);
    expect(bundledQuestions).toHaveLength(74);
    expect(Object.fromEntries(Object.keys(newGameModules).map((gameId) => [gameId, bundledQuestions.filter((question) => question.gameType === gameId).length]))).toEqual({
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

  it("treats logo questions as three progressive crop stages", () => {
    const result = logoQuizQuestionSchema.parse({
      ...shared,
      id: "logo-stage-test",
      gameType: "logo_quiz",
      answer: "테스트",
      asset: "/assets/sample.svg",
      metadata: {
        brandCategory: "기술",
        license: "ORIGINAL",
        credit: "직접 제작",
      },
    });
    expect(result.metadata.crops).toHaveLength(3);
    expect(newGameModules.logo_quiz.getStageCount(result, newGameModules.logo_quiz.defaultSettings)).toBe(3);
    expect(newGameModules.logo_quiz.defaultSettings.stageScores).toEqual([3, 2, 1]);
  });

  it("rejects movie title masks outside the poster", () => {
    const result = moviePosterQuestionSchema.safeParse({
      ...shared,
      id: "movie-mask-test",
      gameType: "movie_poster",
      answer: "테스트",
      asset: "/assets/poster.jpg",
      metadata: {
        releaseYear: 2026,
        country: "대한민국",
        titleMasks: [{ x: 80, y: 90, width: 30, height: 20, mode: "BLANK" }],
        license: "ORIGINAL",
        credit: "직접 제작",
      },
    });
    expect(result.success).toBe(false);
  });

  it("covers movie title regions until the answer is revealed", () => {
    const question = moviePosterQuestionSchema.parse({
      ...shared,
      id: "movie-mask-render-test",
      gameType: "movie_poster",
      answer: "테스트",
      asset: "/assets/poster.jpg",
      metadata: {
        releaseYear: 2026,
        country: "대한민국",
        titleMasks: [{ x: 10, y: 75, width: 80, height: 15, mode: "BLUR" }],
        license: "ORIGINAL",
        credit: "직접 제작",
      },
    });
    const sharedProps = { question, stageIndex: 0, runtime: newGameModules.movie_poster.initialRuntime, dispatch: () => undefined };
    const { container, rerender } = render(<newGameModules.movie_poster.QuestionView {...sharedProps} revealed={false} />);
    expect(container.querySelectorAll("span[aria-hidden='true']")).toHaveLength(1);
    rerender(<newGameModules.movie_poster.QuestionView {...sharedProps} revealed />);
    expect(container.querySelectorAll("span[aria-hidden='true']")).toHaveLength(0);
  });

  it("uses one completed image and one fixed drawing style per song", () => {
    const result = songDrawingQuestionSchema.parse({
      ...shared,
      id: "song-drawing-test",
      gameType: "song_drawing",
      answer: "테스트",
      asset: "/assets/song-drawing.png",
      metadata: {
        artist: "테스트 가수",
        visualStyle: "CHILD_DOODLE",
        lyricConcept: "밤하늘 아래 다시 만나는 장면",
        license: "ORIGINAL",
        credit: "직접 제작",
      },
    });
    expect(result.metadata.visualStyle).toBe("CHILD_DOODLE");
    expect(newGameModules.song_drawing.getStageCount(result, newGameModules.song_drawing.defaultSettings)).toBe(1);
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
