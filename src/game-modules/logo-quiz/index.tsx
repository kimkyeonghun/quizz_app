/* eslint-disable react-refresh/only-export-components */
import type { GameModule, NewGameSettings } from "../contracts";
import { keepRuntime, noopRuntime } from "../contracts";
import { MediaFrame, VisualAsset } from "../shared/VisualAsset";
import { logoQuizQuestionSchema, type LogoQuizQuestion } from "./schema";
export { logoQuizQuestionSchema, type LogoQuizQuestion } from "./schema";
type LogoRuntime = typeof noopRuntime;
type LogoAction = { type: "RESET" };

function LogoQuizView({ question, stageIndex }: { question: LogoQuizQuestion; stageIndex: number }) {
  const crop = question.metadata.crops[Math.min(stageIndex, question.metadata.crops.length - 1)];
  const viewBox = crop ? `${crop.x} ${crop.y} ${crop.width} ${crop.height}` : "0 0 100 100";
  return (
    <MediaFrame>
      <VisualAsset
        asset={question.asset}
        symbolId={question.metadata.symbolId}
        viewBox={viewBox}
        alt={`${question.metadata.brandCategory} 로고 ${stageIndex + 1}단계`}
      />
    </MediaFrame>
  );
}

export const logoQuizModule: GameModule<LogoQuizQuestion, NewGameSettings, LogoRuntime, LogoAction> = {
  id: "logo_quiz",
  label: "로고 확대 퀴즈",
  shortDescription: "로고의 작은 영역부터 전체까지 단계별로 보고 브랜드를 맞힙니다.",
  accent: "#d65745",
  engine: "progressive",
  questionSchema: logoQuizQuestionSchema,
  defaultSettings: {
    answerMode: "host",
    roundQuestionCount: 5,
    stageDurationSec: 10,
    stageCount: 3,
    stageScores: [3, 2, 1],
    allowPass: false,
    wrongAnswerPolicy: "LOCK_CURRENT_STAGE",
  },
  instructions: {
    objective: "로고의 좁은 영역부터 단계적으로 확인해 어떤 브랜드인지 맞히는 퀴즈입니다.",
    steps: ["로고의 가장 작은 영역을 공개합니다.", "정답이 없으면 중간 영역을 공개합니다.", "마지막 단계에서 전체 로고를 공개합니다.", "진행자가 정답 또는 오답을 판정합니다."],
    scoring: ["첫 단계 3점, 두 번째 2점, 전체 공개 단계 1점이 기본입니다.", "현재 공개 단계의 점수를 정답 팀에 부여합니다."],
    hostTips: ["첫 crop에 브랜드명이 그대로 노출되지 않았는지 확인하세요.", "비슷한 표기는 허용 답안 목록을 참고하세요."],
  },
  initialRuntime: noopRuntime,
  reduceRuntime: keepRuntime,
  getStageCount: (question) => question.metadata.crops.length,
  QuestionView: LogoQuizView,
};
