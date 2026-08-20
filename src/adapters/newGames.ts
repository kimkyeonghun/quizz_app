import { defaultConfig } from "../config/defaults";
import { gameDefinitions, gameRegistry } from "../config/gameRegistry";
import type { GameDefinition, GameSettings, GameType } from "../domain/types";
import type { NewGameId } from "../game-modules/contracts";
import { newGameModules } from "../game-modules/registry";

const engineByGame: Record<NewGameId, GameDefinition["engine"]> = {
  music_intro: "progressive",
  zoom_image: "progressive",
  logo_quiz: "standard",
  movie_poster: "standard",
  song_drawing: "progressive",
  taboo: "speed",
};

export const newGameDefinitions = Object.fromEntries(
  Object.values(newGameModules).map((module) => [
    module.id,
    {
      id: module.id,
      label: module.label,
      shortDescription: module.shortDescription,
      accent: module.accent,
      engine: engineByGame[module.id],
      defaultSettings: module.defaultSettings as GameSettings,
      guide: module.instructions,
    } satisfies GameDefinition,
  ]),
) as Record<NewGameId, GameDefinition>;

export const playableGameRegistry: Record<GameType, GameDefinition> = {
  ...gameRegistry,
  ...newGameDefinitions,
};

export const availableGameDefinitions = [
  ...gameDefinitions,
  ...Object.values(newGameDefinitions).filter(
    (definition) => definition.id !== "taboo" || defaultConfig.features.tabooGame,
  ),
];

export function getPlayableGameDefinition(gameId: GameType): GameDefinition {
  return playableGameRegistry[gameId];
}
