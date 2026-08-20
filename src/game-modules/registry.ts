import { z } from "zod";
import { logoQuizModule, logoQuizQuestionSchema, type LogoQuizQuestion } from "./logo-quiz";
import { moviePosterModule, moviePosterQuestionSchema, type MoviePosterQuestion } from "./movie-poster";
import { musicIntroModule, musicIntroQuestionSchema, type MusicIntroQuestion } from "./music-intro";
import { songDrawingModule, songDrawingQuestionSchema, type SongDrawingQuestion } from "./song-drawing";
import { tabooModule, tabooQuestionSchema, type TabooQuestion } from "./taboo";
import { zoomImageModule, zoomImageQuestionSchema, type ZoomImageQuestion } from "./zoom-image";

export const newGameModules = {
  music_intro: musicIntroModule,
  zoom_image: zoomImageModule,
  logo_quiz: logoQuizModule,
  movie_poster: moviePosterModule,
  song_drawing: songDrawingModule,
  taboo: tabooModule,
} as const;

export type NewGameModule = (typeof newGameModules)[keyof typeof newGameModules];
export type NewGameQuestion =
  | MusicIntroQuestion
  | ZoomImageQuestion
  | LogoQuizQuestion
  | MoviePosterQuestion
  | SongDrawingQuestion
  | TabooQuestion;

export const newGameQuestionSchema = z.discriminatedUnion("gameType", [
  musicIntroQuestionSchema,
  zoomImageQuestionSchema,
  logoQuizQuestionSchema,
  moviePosterQuestionSchema,
  songDrawingQuestionSchema,
  tabooQuestionSchema,
]);

export const newGameQuestionFileSchema = z.array(newGameQuestionSchema);

export function isNewGameId(value: string): value is keyof typeof newGameModules {
  return value in newGameModules;
}

export function getNewGameModule(gameId: string): NewGameModule | undefined {
  return isNewGameId(gameId) ? newGameModules[gameId] : undefined;
}
