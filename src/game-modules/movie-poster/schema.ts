import { z } from "zod";
import { commonQuestionShape, mediaCreditShape, positiveInteger } from "../schema";

const titleMaskSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().positive().max(100),
  height: z.number().positive().max(100),
  mode: z.enum(["BLUR", "BLANK"]),
}).strict().refine(
  (mask) => mask.x + mask.width <= 100 && mask.y + mask.height <= 100,
  "제목 마스크는 포스터 범위를 벗어날 수 없습니다.",
);

export const moviePosterQuestionSchema = z.object({
  ...commonQuestionShape,
  gameType: z.literal("movie_poster"),
  answer: z.string().min(1),
  asset: z.string().min(1),
  metadata: z.object({
    symbolId: z.string().min(1).optional(),
    releaseYear: positiveInteger.min(1888).max(2200),
    country: z.string().min(1),
    posterAspectRatio: z.object({
      width: positiveInteger,
      height: positiveInteger,
    }).strict().default({ width: 2, height: 3 }),
    titleMasks: z.array(titleMaskSchema).default([]),
    ...mediaCreditShape,
  }).strict(),
}).strict();

export type MoviePosterQuestion = z.infer<typeof moviePosterQuestionSchema>;
