/* eslint-disable react-refresh/only-export-components */
import type { GameModule, NewGameSettings } from "../contracts";
import { keepRuntime, noopRuntime } from "../contracts";
import { MediaFrame, VisualAsset } from "../shared/VisualAsset";
import { zoomImageQuestionSchema, type ZoomImageQuestion } from "./schema";
export { zoomImageQuestionSchema, type ZoomImageQuestion } from "./schema";
type ZoomRuntime = typeof noopRuntime;
type ZoomAction = { type: "RESET" };

function ZoomImageView({ question, stageIndex }: { question: ZoomImageQuestion; stageIndex: number }) {
  const crop = question.metadata.crops[Math.min(stageIndex, question.metadata.crops.length - 1)];
  const viewBox = crop ? `${crop.x} ${crop.y} ${crop.width} ${crop.height}` : "0 0 100 100";
  return (
    <MediaFrame>
      <VisualAsset asset={question.asset} symbolId={question.metadata.symbolId} viewBox={viewBox} alt={`확대 이미지 ${stageIndex + 1}단계`} />
    </MediaFrame>
  );
}

export const zoomImageModule: GameModule<ZoomImageQuestion, NewGameSettings, ZoomRuntime, ZoomAction> = {
  id: "zoom_image",
  label: "이미지 확대",
  shortDescription: "크게 확대된 일부부터 보고 원래 사물을 맞힙니다.",
  accent: "#3f6fb5",
  engine: "progressive",
  questionSchema: zoomImageQuestionSchema,
  defaultSettings: {
    stageDurationSec: 10,
    stageScores: [3, 2, 1],
    allowPass: false,
    wrongAnswerPolicy: "STEAL",
  },
  instructions: {
    objective: "이미지의 좁은 영역부터 단계적으로 확인해 원래 사물을 맞힙니다.",
    steps: ["가장 확대된 영역을 공개합니다.", "정답이 없으면 다음 확대 단계를 엽니다.", "마지막 단계에서는 전체에 가까운 이미지를 보여줍니다.", "진행자가 정답을 공개합니다."],
    scoring: ["첫 단계 3점, 두 번째 2점, 마지막 1점이 기본입니다.", "현재 공개 단계의 점수를 정답 팀에 부여합니다."],
    hostTips: ["첫 crop에 결정적인 글자가 포함되지 않게 확인하세요.", "각 crop이 이전 단계보다 넓은지 데이터 검증을 실행하세요."],
  },
  initialRuntime: noopRuntime,
  reduceRuntime: keepRuntime,
  getStageCount: (question) => question.metadata.crops.length,
  QuestionView: ZoomImageView,
};
