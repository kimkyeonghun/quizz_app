import { z } from "zod";
import { commonQuestionShape, mediaCreditShape } from "../schema";

export const musicIntroQuestionSchema = z.object({
  ...commonQuestionShape,
  gameType: z.literal("music_intro"),
  answer: z.string().min(1),
  asset: z.string().min(1),
  metadata: z.object({
    artist: z.string().min(1),
    clipStartSec: z.number().min(0),
    clipDurationsSec: z.array(z.number().positive()).min(1),
    ...mediaCreditShape,
  }).strict(),
}).strict();

export type MusicIntroQuestion = z.infer<typeof musicIntroQuestionSchema>;
