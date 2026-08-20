import { z } from "zod";
import rawDefaults from "../../config/defaults.json";
import { GAME_TYPES } from "../domain/types";

const wrongAnswerPolicySchema = z.enum([
  "STEAL",
  "RETRY_SAME_TEAM",
  "END_QUESTION",
  "HOST_DECIDES",
  "LOCK_CURRENT_STAGE",
]);

const gameSettingsSchema = z.object({
  answerMode: z.enum(["host", "direct_input"]).optional(),
  roundQuestionCount: z.number().int().positive().optional(),
  roundDurationSec: z.number().int().positive().optional(),
  questionDurationSec: z.number().int().positive().optional(),
  stageDurationSec: z.number().int().positive().optional(),
  previewDurationSec: z.number().int().positive().optional(),
  scorePerCorrect: z.number().min(0).optional(),
  scoreOnSuccess: z.number().min(0).optional(),
  stageScores: z.array(z.number().min(0)).min(1).optional(),
  stageCount: z.number().int().min(1).max(10).optional(),
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
}).strict().superRefine((config, context) => {
  const hint = config.games.progressive_hint;
  const career = config.games.football_career;
  const music = config.games.music_intro;
  const logo = config.games.logo_quiz;
  const zoom = config.games.zoom_image;
  if (hint.stageCount !== 3 || hint.stageScores?.length !== 3) context.addIssue({ code: "custom", path: ["games", "progressive_hint"], message: "3단 힌트는 단계와 점수가 정확히 3개여야 합니다." });
  if (career.stageCount !== 1 || career.stageScores?.length !== 1) context.addIssue({ code: "custom", path: ["games", "football_career"], message: "선수 커리어는 전체 경력을 공개하는 단일 단계여야 합니다." });
  if (music.stageCount !== 3 || music.stageScores?.length !== 3) context.addIssue({ code: "custom", path: ["games", "music_intro"], message: "음악 전주는 단계와 점수가 정확히 3개여야 합니다." });
  if (logo.stageCount !== 3 || logo.stageScores?.length !== 3) context.addIssue({ code: "custom", path: ["games", "logo_quiz"], message: "로고 확대는 단계와 점수가 정확히 3개여야 합니다." });
  if (zoom.stageCount !== 3 || zoom.stageScores?.length !== 3) context.addIssue({ code: "custom", path: ["games", "zoom_image"], message: "기존 이미지 확대 세션은 단계와 점수가 정확히 3개여야 합니다." });
  const three = config.games.three_in_time;
  if ((three.questionDurationSec ?? 0) < 3 || (three.questionDurationSec ?? 0) > 15) context.addIssue({ code: "custom", path: ["games", "three_in_time", "questionDurationSec"], message: "3~15초 범위여야 합니다." });
  if ((three.requiredCount ?? 0) < 2 || (three.requiredCount ?? 0) > 5) context.addIssue({ code: "custom", path: ["games", "three_in_time", "requiredCount"], message: "2~5개 범위여야 합니다." });
});

export const defaultConfig = defaultConfigSchema.parse(rawDefaults);
