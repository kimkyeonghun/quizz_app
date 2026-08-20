import { z } from "zod";
import { commonQuestionShape, mediaCreditShape } from "../schema";

const cropSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().positive().max(100),
  height: z.number().positive().max(100),
}).strict().refine(
  (crop) => crop.x + crop.width <= 100 && crop.y + crop.height <= 100,
  "crop 영역은 이미지 범위를 벗어날 수 없습니다.",
);

export const zoomImageQuestionSchema = z.object({
  ...commonQuestionShape,
  gameType: z.literal("zoom_image"),
  answer: z.string().min(1),
  asset: z.string().min(1),
  metadata: z.object({
    symbolId: z.string().min(1).optional(),
    crops: z.array(cropSchema).min(2),
    ...mediaCreditShape,
  }).strict(),
}).strict().refine(
  (question) => question.metadata.crops.every((crop, index, crops) => index === 0 || crop.width * crop.height >= crops[index - 1].width * crops[index - 1].height),
  { path: ["metadata", "crops"], message: "crop은 단계가 진행될수록 같거나 넓어야 합니다." },
);

export type ZoomImageQuestion = z.infer<typeof zoomImageQuestionSchema>;
