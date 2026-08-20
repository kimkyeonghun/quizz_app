import { z } from "zod";
import { commonQuestionShape, mediaCreditShape } from "../schema";

export const logoQuizQuestionSchema = z.object({
  ...commonQuestionShape,
  gameType: z.literal("logo_quiz"),
  answer: z.string().min(1),
  asset: z.string().min(1),
  metadata: z.object({
    symbolId: z.string().min(1).optional(),
    brandCategory: z.string().min(1),
    ...mediaCreditShape,
  }).strict(),
}).strict();

export type LogoQuizQuestion = z.infer<typeof logoQuizQuestionSchema>;
