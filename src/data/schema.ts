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
  asset: z.string().min(1).nullable().optional(),
  source: z.string().min(1).nullable().optional(),
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
  .strict();

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
      })
      .strict(),
  })
  .strict();

export const progressiveHintQuestionSchema = z
  .object({
    ...commonShape,
    gameType: z.literal("progressive_hint"),
    answer: answerRequired,
    metadata: z.object({ hints: z.array(z.string().min(1)).min(2) }).strict(),
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
        revealStages: z.array(z.array(z.number().int().min(0)).min(1)).min(2),
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
