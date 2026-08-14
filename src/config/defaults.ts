import { z } from "zod";
import rawDefaults from "../../config/defaults.json";
import { GAME_TYPES } from "../domain/types";

const wrongAnswerPolicySchema = z.enum([
  "STEAL",
  "RETRY_SAME_TEAM",
  "END_QUESTION",
  "HOST_DECIDES",
]);

const gameSettingsSchema = z.object({
  roundDurationSec: z.number().int().positive().optional(),
  questionDurationSec: z.number().int().positive().optional(),
  stageDurationSec: z.number().int().positive().optional(),
  previewDurationSec: z.number().int().positive().optional(),
  scorePerCorrect: z.number().min(0).optional(),
  scoreOnSuccess: z.number().min(0).optional(),
  stageScores: z.array(z.number().min(0)).min(1).optional(),
  requiredCount: z.number().int().positive().optional(),
  allowPass: z.boolean().optional(),
  wrongAnswerPolicy: wrongAnswerPolicySchema,
}).strict();

const defaultConfigSchema = z.object({
  global: z.object({
    wrongAnswerPolicy: wrongAnswerPolicySchema,
    excludeUsedQuestions: z.boolean(),
    verifiedOnly: z.boolean(),
    questionOrder: z.enum(["random", "data"]),
    allowUndo: z.boolean(),
  }).strict(),
  features: z.object({ tabooGame: z.boolean() }).strict(),
  games: z.record(z.enum(GAME_TYPES), gameSettingsSchema).refine(
    (games) => GAME_TYPES.every((gameType) => gameType in games),
    "12개 게임의 기본 설정이 모두 필요합니다.",
  ),
}).strict();

export const defaultConfig = defaultConfigSchema.parse(rawDefaults);
