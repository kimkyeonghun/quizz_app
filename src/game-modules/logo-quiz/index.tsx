import { z } from "zod";
import type { GameModule, NewGameSettings } from "../contracts";
import { keepRuntime, noopRuntime } from "../contracts";
import { commonQuestionShape, mediaCreditShape } from "../schema";
import { MediaFrame, VisualAsset } from "../shared/VisualAsset";

export const logoQuizQuestionSchema = z
  .object({
    ...commonQuestionShape,
    gameType: z.literal("logo_quiz"),
    answer: z.string().min(1),
    asset: z.string().min(1),
    metadata: z
      .object({
        symbolId: z.string().min(1).optional(),
        brandCategory: z.string().min(1),
        ...mediaCreditShape,
      })
      .strict(),
  })
  .strict();

export type LogoQuizQuestion = z.infer<typeof logoQuizQuestionSchema>;
type LogoRuntime = typeof noopRuntime;
type LogoAction = { type: "RESET" };

function LogoQuizView({ question }: { question: LogoQuizQuestion }) {
  return (
    <MediaFrame>
      <VisualAsset
        asset={question.asset}
        symbolId={question.metadata.symbolId}
        alt={`${question.metadata.brandCategory} 로고`}
      />
    </MediaFrame>
  );
}

export const logoQuizModule: GameModule<LogoQuizQuestion, NewGameSettings, LogoRuntime, LogoAction> = {
  id: "logo_quiz",
  label: "로고 퀴즈",
  shortDescription: "로고의 모양과 색을 보고 브랜드 이름을 맞힙니다.",
  accent: "#d65745",
  engine: "media",
  questionSchema: logoQuizQuestionSchema,
  defaultSettings: {
    questionDurationSec: 20,
    scoreOnSuccess: 1,
    allowPass: false,
    wrongAnswerPolicy: "STEAL",
  },
  instructions: {
    objective: "화면에 표시된 로고가 어떤 브랜드인지 맞히는 이미지 퀴즈입니다.",
    steps: ["로고를 공개합니다.", "현재 팀의 답을 받습니다.", "진행자가 정답 또는 오답을 판정합니다.", "정답 확인 후 다음 문제로 이동합니다."],
    scoring: ["정답은 기본 1점입니다.", "오답 정책이 상대팀 기회이면 다음 팀이 답할 수 있습니다."],
    hostTips: ["로고 안에 정답 글자가 노출되지 않았는지 확인하세요.", "비슷한 표기는 허용 답안 목록을 참고하세요."],
  },
  initialRuntime: noopRuntime,
  reduceRuntime: keepRuntime,
  getStageCount: () => 1,
  QuestionView: LogoQuizView,
};
