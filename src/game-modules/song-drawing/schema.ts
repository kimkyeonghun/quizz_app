import { z } from "zod";
import { commonQuestionShape, mediaCreditShape } from "../schema";

export const songDrawingQuestionSchema = z.object({
  ...commonQuestionShape,
  gameType: z.literal("song_drawing"),
  answer: z.string().min(1),
  asset: z.string().min(1),
  metadata: z.object({
    artist: z.string().min(1),
    stageSymbolIds: z.array(z.string().min(1)).min(2),
    ...mediaCreditShape,
  }).strict(),
}).strict();

export type SongDrawingQuestion = z.infer<typeof songDrawingQuestionSchema>;
