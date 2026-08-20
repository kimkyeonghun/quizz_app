/* eslint-disable react-refresh/only-export-components */
import type { PlayableQuestion } from "../domain/types";
import { logoQuizModule } from "../game-modules/logo-quiz";
import { moviePosterModule } from "../game-modules/movie-poster";
import { musicIntroModule } from "../game-modules/music-intro";
import { songDrawingModule } from "../game-modules/song-drawing";
import { tabooModule, type TabooAction, type TabooRuntime } from "../game-modules/taboo";
import { zoomImageModule } from "../game-modules/zoom-image";

interface NewGameQuestionContentProps {
  question: Exclude<PlayableQuestion, { gameType: "person_quiz" | "charades" | "four_syllable" | "three_in_time" | "progressive_hint" | "football_career" }>;
  stageIndex: number;
  revealed: boolean;
  runtime: unknown;
  dispatch: (action: unknown) => void;
}

export function NewGameQuestionContent({ question, stageIndex, revealed, runtime, dispatch }: NewGameQuestionContentProps) {
  const shared = { stageIndex, revealed };
  if (question.gameType === "logo_quiz") return <logoQuizModule.QuestionView question={question} {...shared} runtime={logoQuizModule.initialRuntime} dispatch={() => undefined} />;
  if (question.gameType === "movie_poster") return <moviePosterModule.QuestionView question={question} {...shared} runtime={moviePosterModule.initialRuntime} dispatch={() => undefined} />;
  if (question.gameType === "zoom_image") return <zoomImageModule.QuestionView question={question} {...shared} runtime={zoomImageModule.initialRuntime} dispatch={() => undefined} />;
  if (question.gameType === "music_intro") return <musicIntroModule.QuestionView question={question} {...shared} runtime={musicIntroModule.initialRuntime} dispatch={() => undefined} />;
  if (question.gameType === "song_drawing") return <songDrawingModule.QuestionView question={question} {...shared} runtime={songDrawingModule.initialRuntime} dispatch={() => undefined} />;
  if (question.gameType === "taboo") {
    return <tabooModule.QuestionView question={question} {...shared} runtime={(runtime ?? tabooModule.initialRuntime) as TabooRuntime} dispatch={(action: TabooAction) => dispatch(action)} />;
  }
  return null;
}

export function initialNewGameRuntime(gameId: string): unknown {
  if (gameId === "taboo") return tabooModule.initialRuntime;
  return {};
}

export function reduceNewGameRuntime(gameId: string, runtime: unknown, action: unknown): unknown {
  if (gameId === "taboo") return tabooModule.reduceRuntime((runtime ?? tabooModule.initialRuntime) as TabooRuntime, action as TabooAction);
  return runtime;
}

export function getNewGameStageCount(question: PlayableQuestion): number {
  if (question.gameType === "logo_quiz") return logoQuizModule.getStageCount(question, logoQuizModule.defaultSettings);
  if (question.gameType === "zoom_image") return zoomImageModule.getStageCount(question, zoomImageModule.defaultSettings);
  if (question.gameType === "music_intro") return musicIntroModule.getStageCount(question, musicIntroModule.defaultSettings);
  return 1;
}
