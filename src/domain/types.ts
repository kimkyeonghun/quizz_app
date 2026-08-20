export const GAME_TYPES = [
  "person_quiz",
  "music_intro",
  "charades",
  "four_syllable",
  "three_in_time",
  "zoom_image",
  "logo_quiz",
  "movie_poster",
  "progressive_hint",
  "song_drawing",
  "taboo",
  "football_career",
] as const;

export type GameType = (typeof GAME_TYPES)[number];

export const MVP_GAME_TYPES = [
  "person_quiz",
  "charades",
  "four_syllable",
  "three_in_time",
  "progressive_hint",
  "football_career",
] as const satisfies readonly GameType[];

export type MvpGameType = (typeof MVP_GAME_TYPES)[number];
export type PlayableGameType = GameType;
export type EngineType = "speed" | "standard" | "progressive";
export type WrongAnswerPolicy =
  | "STEAL"
  | "RETRY_SAME_TEAM"
  | "END_QUESTION"
  | "HOST_DECIDES"
  | "LOCK_CURRENT_STAGE";

export type GameplayPhase = "ready" | "preview" | "active" | "attempt" | "revealed";

export type AppScreen =
  | "home"
  | "data_admin"
  | "session_setup"
  | "game_select"
  | "game_intro"
  | "game_setup"
  | "game_play"
  | "round_result"
  | "scoreboard"
  | "final_result";

export type TimerStatus = "idle" | "running" | "paused" | "expired";

export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
}

export interface FilterSettings {
  difficultyMin: number;
  difficultyMax: number;
  category: string;
  tags: string[];
  verifiedOnly: boolean;
  excludeUsedQuestions: boolean;
  includePrivateQuestions: boolean;
  questionOrder: "random" | "data";
}

export interface GameSettings {
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
  requiredCount?: number;
  allowPass?: boolean;
  wrongAnswerPolicy: WrongAnswerPolicy;
}

export interface ContentSource {
  title: string;
  publisher: string;
  url: string;
  accessedAt: string;
}

export interface AssetAttribution {
  author: string;
  sourceUrl: string;
  license: "CC0" | "PDM" | "CC BY 2.0" | "CC BY 3.0" | "CC BY 4.0" | "CC BY-SA 3.0" | "CC BY-SA 4.0" | "PRIVATE LOCAL USE";
  licenseUrl?: string;
  modified: string;
  accessedAt: string;
}

export interface BaseQuestion {
  id: string;
  gameType: GameType;
  answer: string | null;
  acceptedAnswers?: string[];
  category: string;
  subcategory?: string;
  tags?: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  enabled: boolean;
  verified: boolean;
  usageScope?: "redistributable" | "private_only";
  asset?: string | null;
  metadata?: Record<string, unknown>;
  source?: string | null;
  sources?: ContentSource[];
  attribution?: AssetAttribution;
  notes?: string;
  createdAt?: string;
  version?: number;
}

export interface PersonQuestion extends BaseQuestion {
  gameType: "person_quiz";
  answer: string;
  metadata?: { clue?: string };
}

export interface CharadesQuestion extends BaseQuestion {
  gameType: "charades";
  answer: string;
}

export interface FourSyllableQuestion extends BaseQuestion {
  gameType: "four_syllable";
  answer: string;
  metadata: { prompt: string; fullAnswer: string };
}

export interface ThreeInTimeQuestion extends BaseQuestion {
  gameType: "three_in_time";
  answer: null;
  metadata: {
    prompt: string;
    requiredCount: number;
    validationMode: "host";
    examples: string[];
    judgingNotes: string;
  };
}

export interface ProgressiveHintQuestion extends BaseQuestion {
  gameType: "progressive_hint";
  answer: string;
  metadata: { hints: string[] };
}

export interface FootballCareerQuestion extends BaseQuestion {
  gameType: "football_career";
  answer: string;
  metadata: {
    career: Array<{ club: string; order: number }>;
    verifiedAt: string;
  };
}

export type MvpQuestion =
  | PersonQuestion
  | CharadesQuestion
  | FourSyllableQuestion
  | ThreeInTimeQuestion
  | ProgressiveHintQuestion
  | FootballCareerQuestion;

export type { NewGameQuestion as PlayableNewGameQuestion } from "../game-modules/questionSchemas";
import type { NewGameQuestion } from "../game-modules/questionSchemas";
export type PlayableQuestion = MvpQuestion | NewGameQuestion;

export type HostAction =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "ATTEMPT"; teamId: string }
  | { type: "CORRECT"; teamId: string }
  | { type: "WRONG"; teamId?: string }
  | { type: "PASS" }
  | { type: "STEAL"; teamId: string }
  | { type: "RETRY" }
  | { type: "NEXT_STAGE" }
  | { type: "REVEAL" }
  | { type: "NEXT" }
  | { type: "END" }
  | { type: "UNDO" };

export interface GameDefinition {
  id: GameType;
  label: string;
  shortDescription: string;
  engine: EngineType;
  accent: string;
  defaultSettings: GameSettings;
  guide: {
    objective: string;
    steps: string[];
    scoring: string[];
    hostTips: string[];
  };
}
