import type { ComponentType } from "react";
import type { ZodType } from "zod";
import type { EngineType } from "../domain/types";

export const NEW_GAME_IDS = [
  "music_intro",
  "zoom_image",
  "logo_quiz",
  "movie_poster",
  "song_drawing",
  "taboo",
] as const;

export type NewGameId = (typeof NEW_GAME_IDS)[number];
export type NewGameEngine = EngineType;

export interface NewGameQuestionBase {
  id: string;
  gameType: NewGameId;
  answer: string | null;
  acceptedAnswers?: string[];
  category: string;
  subcategory?: string;
  tags?: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  enabled: boolean;
  verified: boolean;
  asset?: string | null;
  source?: string | null;
  notes?: string;
  createdAt?: string;
  version?: number;
}

export interface GameInstructions {
  objective: string;
  steps: string[];
  scoring: string[];
  hostTips: string[];
}

export interface NewGameSettings {
  answerMode?: "host" | "direct_input";
  roundQuestionCount?: number;
  roundDurationSec?: number;
  questionDurationSec?: number;
  stageDurationSec?: number;
  previewDurationSec?: number;
  scorePerCorrect?: number;
  scoreOnSuccess?: number;
  stageScores?: number[];
  stageCount?: number;
  allowPass: boolean;
  wrongAnswerPolicy: "STEAL" | "RETRY_SAME_TEAM" | "END_QUESTION" | "HOST_DECIDES" | "LOCK_CURRENT_STAGE";
}

export interface GameQuestionProps<Question, Runtime, Action> {
  question: Question;
  stageIndex: number;
  revealed: boolean;
  runtime: Runtime;
  dispatch: (action: Action) => void;
}

export interface GameSettingsProps<Settings> {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export interface GameModule<Question, Settings, Runtime, Action> {
  id: NewGameId;
  label: string;
  shortDescription: string;
  accent: string;
  engine: NewGameEngine;
  questionSchema: ZodType<Question>;
  defaultSettings: Settings;
  instructions: GameInstructions;
  initialRuntime: Runtime;
  reduceRuntime: (runtime: Runtime, action: Action) => Runtime;
  getStageCount: (question: Question, settings: Settings) => number;
  QuestionView: ComponentType<GameQuestionProps<Question, Runtime, Action>>;
  SettingsView?: ComponentType<GameSettingsProps<Settings>>;
}

export type AnyGameModule = GameModule<unknown, NewGameSettings, unknown, unknown>;

export const noopRuntime = Object.freeze({});

export function keepRuntime<Runtime>(runtime: Runtime): Runtime {
  return runtime;
}
