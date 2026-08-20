import { z } from "zod";
import { commonQuestionShape, mediaCreditShape } from "../schema";

const logoCropSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().positive().max(100),
  height: z.number().positive().max(100),
}).strict().refine(
  (crop) => crop.x + crop.width <= 100 && crop.y + crop.height <= 100,
  "crop 영역은 이미지 범위를 벗어날 수 없습니다.",
);

const defaultLogoCrops = [
  { x: 42, y: 42, width: 16, height: 16 },
  { x: 25, y: 25, width: 50, height: 50 },
  { x: 0, y: 0, width: 100, height: 100 },
];

export const logoQuizQuestionSchema = z.object({
  ...commonQuestionShape,
  gameType: z.literal("logo_quiz"),
  answer: z.string().min(1),
  asset: z.string().min(1),
  metadata: z.object({
    symbolId: z.string().min(1).optional(),
    brandCategory: z.string().min(1),
    crops: z.array(logoCropSchema).length(3).default(defaultLogoCrops),
    ...mediaCreditShape,
  }).strict(),
}).strict().refine(
  (question) => question.metadata.crops.every((crop, index, crops) => index === 0 || crop.width * crop.height >= crops[index - 1].width * crops[index - 1].height),
  { path: ["metadata", "crops"], message: "crop은 단계가 진행될수록 같거나 넓어야 합니다." },
);

export type LogoQuizQuestion = z.infer<typeof logoQuizQuestionSchema>;
