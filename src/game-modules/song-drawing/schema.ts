import { z } from "zod";
import { commonQuestionShape, mediaCreditShape } from "../schema";

export const songDrawingStyleSchema = z.enum([
  "CHILD_DOODLE",
  "ADULT_SKETCH",
  "PROFESSIONAL_ILLUSTRATION",
]);

export type SongDrawingStyle = z.infer<typeof songDrawingStyleSchema>;

export const songDrawingQuestionSchema = z.object({
  ...commonQuestionShape,
  gameType: z.literal("song_drawing"),
  answer: z.string().min(1),
  asset: z.string().min(1),
  metadata: z.object({
    artist: z.string().min(1),
    visualStyle: songDrawingStyleSchema.default("ADULT_SKETCH"),
    lyricConcept: z.string().min(1).optional(),
    symbolId: z.string().min(1).optional(),
    stageSymbolIds: z.array(z.string().min(1)).min(1).optional(),
    ...mediaCreditShape,
  }).strict(),
}).strict();

export type SongDrawingQuestion = z.infer<typeof songDrawingQuestionSchema>;
