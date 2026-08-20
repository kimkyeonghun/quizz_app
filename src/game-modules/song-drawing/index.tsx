/* eslint-disable react-refresh/only-export-components */
import type { GameModule, GameQuestionProps, NewGameSettings } from "../contracts";
import { keepRuntime, noopRuntime } from "../contracts";
import styles from "../shared/MediaFrame.module.css";
import { MediaFrame } from "../shared/VisualAsset";
import { songDrawingQuestionSchema, type SongDrawingQuestion } from "./schema";
export { songDrawingQuestionSchema, type SongDrawingQuestion } from "./schema";
type DrawingRuntime = typeof noopRuntime;
type DrawingAction = { type: "RESET" };

function SongDrawingView({ question, stageIndex }: GameQuestionProps<SongDrawingQuestion, DrawingRuntime, DrawingAction>) {
  const asset = `${import.meta.env.BASE_URL}${question.asset.replace(/^\//, "")}`;
  return (
    <MediaFrame>
      <div className={styles.drawingGrid} role="img" aria-label={`${stageIndex + 1}단계 노래 그림 힌트`}>
        {question.metadata.stageSymbolIds.map((symbolId, index) => (
          <div className={styles.drawingCell} key={symbolId}>
            {index <= stageIndex ? (
              <svg viewBox="0 0 100 100" aria-hidden="true"><use href={`${asset}#${symbolId}`} /></svg>
            ) : (
              <span className={styles.drawingLocked}>?</span>
            )}
          </div>
        ))}
      </div>
    </MediaFrame>
  );
}

export const songDrawingModule: GameModule<SongDrawingQuestion, NewGameSettings, DrawingRuntime, DrawingAction> = {
  id: "song_drawing",
  label: "노래 그림",
  shortDescription: "차례로 공개되는 그림을 조합해 노래 제목을 맞힙니다.",
  accent: "#ad5e8d",
  engine: "progressive",
  questionSchema: songDrawingQuestionSchema,
  defaultSettings: {
    stageDurationSec: 15,
    stageScores: [3, 2, 1],
    allowPass: false,
    wrongAnswerPolicy: "STEAL",
  },
  instructions: {
    objective: "노래 제목을 표현한 그림 힌트를 순서대로 보고 곡명을 맞힙니다.",
    steps: ["첫 그림을 공개합니다.", "정답이 없으면 다음 그림을 추가합니다.", "모든 그림을 조합해 제목을 추리합니다.", "곡명과 아티스트를 공개합니다."],
    scoring: ["첫 그림 3점, 두 번째 2점, 마지막 1점이 기본입니다.", "현재 공개 단계의 점수를 적용합니다."],
    hostTips: ["그림을 설명하거나 읽어주지 마세요.", "제목의 조사 차이는 허용 답안으로 관리하세요."],
  },
  initialRuntime: noopRuntime,
  reduceRuntime: keepRuntime,
  getStageCount: (question) => question.metadata.stageSymbolIds.length,
  QuestionView: SongDrawingView,
};
