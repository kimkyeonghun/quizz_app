import { logoQuizModule } from "./logo-quiz";
import { moviePosterModule } from "./movie-poster";
import { musicIntroModule } from "./music-intro";
import { songDrawingModule } from "./song-drawing";
import { tabooModule } from "./taboo";
import { zoomImageModule } from "./zoom-image";
export { newGameQuestionFileSchema, newGameQuestionSchema, type NewGameQuestion } from "./questionSchemas";

export const newGameModules = {
  music_intro: musicIntroModule,
  zoom_image: zoomImageModule,
  logo_quiz: logoQuizModule,
  movie_poster: moviePosterModule,
  song_drawing: songDrawingModule,
  taboo: tabooModule,
} as const;

export type NewGameModule = (typeof newGameModules)[keyof typeof newGameModules];
export function isNewGameId(value: string): value is keyof typeof newGameModules {
  return value in newGameModules;
}

export function getNewGameModule(gameId: string): NewGameModule | undefined {
  return isNewGameId(gameId) ? newGameModules[gameId] : undefined;
}
