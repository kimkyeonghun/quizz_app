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
export type EngineType = "speed" | "standard" | "progressive";
export type WrongAnswerPolicy =
  | "STEAL"
  | "RETRY_SAME_TEAM"
  | "END_QUESTION"
  | "HOST_DECIDES";

export type AppScreen =
  | "home"
  | "session_setup"
  | "game_select"
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
  questionOrder: "random" | "data";
}

export interface GameSettings {
  roundDurationSec?: number;
  questionDurationSec?: number;
  stageDurationSec?: number;
  previewDurationSec?: number;
  scorePerCorrect?: number;
  scoreOnSuccess?: number;
  stageScores?: number[];
  requiredCount?: number;
  allowPass?: boolean;
  wrongAnswerPolicy: WrongAnswerPolicy;
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
  asset?: string | null;
  metadata?: Record<string, unknown>;
  source?: string | null;
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
  metadata: { prompt: string; requiredCount: number; validationMode: "host" };
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
    revealStages: number[][];
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

export type HostAction =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "CORRECT"; teamId: string }
  | { type: "WRONG" }
  | { type: "PASS" }
  | { type: "STEAL"; teamId: string }
  | { type: "RETRY" }
  | { type: "NEXT_STAGE" }
  | { type: "REVEAL" }
  | { type: "NEXT" }
  | { type: "END" }
  | { type: "UNDO" };

export interface GameDefinition {
  id: MvpGameType;
  label: string;
  shortDescription: string;
  engine: EngineType;
  accent: string;
  defaultSettings: GameSettings;
}
