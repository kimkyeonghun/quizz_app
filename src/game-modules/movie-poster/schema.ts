import { z } from "zod";
import { commonQuestionShape, mediaCreditShape, positiveInteger } from "../schema";

export const moviePosterQuestionSchema = z.object({
  ...commonQuestionShape,
  gameType: z.literal("movie_poster"),
  answer: z.string().min(1),
  asset: z.string().min(1),
  metadata: z.object({
    symbolId: z.string().min(1).optional(),
    releaseYear: positiveInteger.min(1888).max(2200),
    country: z.string().min(1),
    ...mediaCreditShape,
  }).strict(),
}).strict();

export type MoviePosterQuestion = z.infer<typeof moviePosterQuestionSchema>;
