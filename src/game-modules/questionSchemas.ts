import { z } from "zod";
import { logoQuizQuestionSchema, type LogoQuizQuestion } from "./logo-quiz/schema";
import { moviePosterQuestionSchema, type MoviePosterQuestion } from "./movie-poster/schema";
import { musicIntroQuestionSchema, type MusicIntroQuestion } from "./music-intro/schema";
import { songDrawingQuestionSchema, type SongDrawingQuestion } from "./song-drawing/schema";
import { tabooQuestionSchema, type TabooQuestion } from "./taboo/schema";
import { zoomImageQuestionSchema, type ZoomImageQuestion } from "./zoom-image/schema";

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
