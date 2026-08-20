import { z } from "zod";
import { commonQuestionShape } from "../schema";

export const tabooQuestionSchema = z.object({
  ...commonQuestionShape,
  gameType: z.literal("taboo"),
  answer: z.string().min(1),
  asset: z.null().optional(),
  metadata: z.object({
    forbiddenWords: z.array(z.string().min(1)).min(4),
  }).strict(),
}).strict().refine(
  (question) => !question.metadata.forbiddenWords.some(
    (word) => word.normalize("NFC").toLocaleLowerCase("ko-KR") === question.answer.normalize("NFC").toLocaleLowerCase("ko-KR"),
  ),
  { path: ["metadata", "forbiddenWords"], message: "정답은 금지어 목록에 포함할 수 없습니다." },
);

export type TabooQuestion = z.infer<typeof tabooQuestionSchema>;
