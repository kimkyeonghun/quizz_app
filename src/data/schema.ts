import { z } from "zod";
import { newGameQuestionSchema } from "../game-modules/questionSchemas";

const difficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const commonShape = {
  id: z.string().min(1),
  answer: z.string().min(1).nullable(),
  acceptedAnswers: z.array(z.string().min(1)).optional(),
  category: z.string().min(1),
  subcategory: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  difficulty: difficultySchema,
  enabled: z.boolean(),
  verified: z.boolean(),
  usageScope: z.enum(["redistributable", "private_only"]).optional(),
  asset: z.string().min(1).nullable().optional(),
  source: z.string().min(1).nullable().optional(),
  sources: z.array(z.object({
    title: z.string().min(1),
    publisher: z.string().min(1),
    url: z.url(),
    accessedAt: z.iso.date(),
  }).strict()).min(1).optional(),
  attribution: z.object({
    author: z.string().min(1),
    sourceUrl: z.url(),
    license: z.enum(["CC0", "PDM", "CC BY 2.0", "CC BY 3.0", "CC BY 4.0", "CC BY-SA 3.0", "CC BY-SA 4.0", "PRIVATE LOCAL USE"]),
    licenseUrl: z.url().optional(),
    modified: z.string().min(1),
    accessedAt: z.iso.date(),
  }).strict().optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  version: z.number().int().min(1).optional(),
};

const answerRequired = z.string().min(1);

export const personQuestionSchema = z
  .object({
    ...commonShape,
    gameType: z.literal("person_quiz"),
    answer: answerRequired,
    metadata: z.object({ clue: z.string().min(1).optional() }).strict().optional(),
  })
  .strict()
  .superRefine((question, context) => {
    if (question.asset && !question.attribution) context.addIssue({ code: "custom", message: "이미지에는 attribution이 필요합니다." });
    if (question.attribution?.license === "PRIVATE LOCAL USE" && question.usageScope !== "private_only") context.addIssue({ code: "custom", message: "로컬 전용 이미지는 usageScope: private_only여야 합니다." });
    if (question.usageScope === "private_only" && question.attribution?.license !== "PRIVATE LOCAL USE") context.addIssue({ code: "custom", message: "private_only 인물 이미지는 PRIVATE LOCAL USE로 표시해야 합니다." });
    if (question.attribution && question.attribution.license !== "PRIVATE LOCAL USE" && !question.attribution.licenseUrl) context.addIssue({ code: "custom", message: "재배포 가능 이미지에는 licenseUrl이 필요합니다." });
  });

export const charadesQuestionSchema = z
  .object({ ...commonShape, gameType: z.literal("charades"), answer: answerRequired })
  .strict();

export const fourSyllableQuestionSchema = z
  .object({
    ...commonShape,
    gameType: z.literal("four_syllable"),
    answer: answerRequired,
    metadata: z
      .object({ prompt: z.string().min(1), fullAnswer: z.string().min(1) })
      .strict(),
  })
  .strict();

export const threeInTimeQuestionSchema = z
  .object({
    ...commonShape,
    gameType: z.literal("three_in_time"),
    answer: z.null(),
    metadata: z
      .object({
        prompt: z.string().min(1),
        requiredCount: z.number().int().min(1),
        validationMode: z.literal("host"),
        examples: z.array(z.string().min(1)).min(5),
        judgingNotes: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export const progressiveHintQuestionSchema = z
  .object({
    ...commonShape,
    gameType: z.literal("progressive_hint"),
    answer: answerRequired,
    metadata: z.object({ hints: z.array(z.string().min(1)).length(3) }).strict(),
  })
  .strict();

export const footballCareerQuestionSchema = z
  .object({
    ...commonShape,
    gameType: z.literal("football_career"),
    answer: answerRequired,
    metadata: z
      .object({
        career: z
          .array(z.object({ club: z.string().min(1), order: z.number().int().min(1) }).strict())
          .min(2),
        verifiedAt: z.iso.date(),
      })
      .strict(),
  })
  .strict();

export const mvpQuestionSchema = z.discriminatedUnion("gameType", [
  personQuestionSchema,
  charadesQuestionSchema,
  fourSyllableQuestionSchema,
  threeInTimeQuestionSchema,
  progressiveHintQuestionSchema,
  footballCareerQuestionSchema,
]);

export const questionSchema = z.union([mvpQuestionSchema, newGameQuestionSchema]);
export const questionFileSchema = z.array(questionSchema);

export type ValidatedQuestion = z.infer<typeof questionSchema>;
