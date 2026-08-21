/* eslint-disable react-refresh/only-export-components */
import type { GameModule, GameQuestionProps, NewGameSettings } from "../contracts";
import { keepRuntime, noopRuntime } from "../contracts";
import styles from "../shared/MediaFrame.module.css";
import { MediaFrame, VisualAsset } from "../shared/VisualAsset";
import { songDrawingQuestionSchema, type SongDrawingQuestion } from "./schema";
export { songDrawingQuestionSchema, type SongDrawingQuestion } from "./schema";
type DrawingRuntime = typeof noopRuntime;
type DrawingAction = { type: "RESET" };

const styleLabels = {
  CHILD_DOODLE: "초등학생 낙서",
  ADULT_SKETCH: "일반 성인 그림",
  PROFESSIONAL_ILLUSTRATION: "전문가 일러스트",
} as const;

function SongDrawingView({ question, revealed }: GameQuestionProps<SongDrawingQuestion, DrawingRuntime, DrawingAction>) {
  const symbolId = question.metadata.symbolId ?? question.metadata.stageSymbolIds?.[0];
  return (
    <MediaFrame>
      <VisualAsset asset={question.asset} symbolId={symbolId} alt="노래 가사를 해석한 한 장의 그림" />
      {revealed && <p className={styles.revealMeta}>{question.metadata.artist} · {styleLabels[question.metadata.visualStyle]}</p>}
    </MediaFrame>
  );
}

export const songDrawingModule: GameModule<SongDrawingQuestion, NewGameSettings, DrawingRuntime, DrawingAction> = {
  id: "song_drawing",
  label: "노래 그림",
  shortDescription: "K-pop 노래 가사를 해석한 한 장의 그림으로 곡명을 맞힙니다.",
  accent: "#ad5e8d",
  engine: "standard",
  questionSchema: songDrawingQuestionSchema,
  defaultSettings: {
    answerMode: "host",
    roundQuestionCount: 10,
    questionDurationSec: 25,
    scoreOnSuccess: 1,
    allowPass: false,
    wrongAnswerPolicy: "END_QUESTION",
  },
  instructions: {
    objective: "K-pop 노래 가사의 장면과 정서를 해석한 완성 그림 한 장을 보고 곡명을 맞힙니다.",
    steps: ["노래별 완성 그림 한 장을 공개합니다.", "그림은 초등학생 낙서, 일반 성인 그림, 전문가 일러스트 중 무작위로 선택된 한 화풍을 사용합니다.", "현재 팀이 곡명을 말합니다.", "진행자가 판정한 뒤 곡명과 아티스트를 공개합니다."],
    scoring: ["정답은 기본 1점입니다.", "화풍에 따른 점수 차이는 두지 않습니다."],
    hostTips: ["그림을 설명하거나 가사를 직접 인용하지 마세요.", "그림 안에 곡명, 가수명, 앨범 로고가 노출되지 않았는지 확인하세요.", "제목의 조사와 영문 표기는 허용 답안으로 관리하세요."],
  },
  initialRuntime: noopRuntime,
  reduceRuntime: keepRuntime,
  getStageCount: () => 1,
  QuestionView: SongDrawingView,
};
