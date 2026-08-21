/* eslint-disable react-refresh/only-export-components */
import { Eye, EyeOff } from "lucide-react";
import type { GameModule, GameQuestionProps, NewGameSettings } from "../contracts";
import styles from "../shared/MediaFrame.module.css";
import { tabooQuestionSchema, type TabooQuestion } from "./schema";
export { tabooQuestionSchema, type TabooQuestion } from "./schema";
export interface TabooRuntime {
  forbiddenWordsVisible: boolean;
}
export type TabooAction = { type: "SHOW_FORBIDDEN" } | { type: "HIDE_FORBIDDEN" };

export function reduceTabooRuntime(runtime: TabooRuntime, action: TabooAction): TabooRuntime {
  if (action.type === "SHOW_FORBIDDEN") return { forbiddenWordsVisible: true };
  if (action.type === "HIDE_FORBIDDEN") return { forbiddenWordsVisible: false };
  return runtime;
}

function TabooView({ question, runtime, dispatch }: GameQuestionProps<TabooQuestion, TabooRuntime, TabooAction>) {
  return (
    <section className={styles.tabooCard} style={{ "--module-accent": "#d94f45" } as React.CSSProperties}>
      <h2>{question.answer}</h2>
      {runtime.forbiddenWordsVisible ? (
        <ul className={styles.forbiddenWords}>{question.metadata.forbiddenWords.map((word) => <li key={word}>{word}</li>)}</ul>
      ) : (
        <p className={styles.tabooHidden}>금지어 숨김</p>
      )}
      <button
        type="button"
        className={styles.tabooToggle}
        onClick={() => dispatch({ type: runtime.forbiddenWordsVisible ? "HIDE_FORBIDDEN" : "SHOW_FORBIDDEN" })}
        title={runtime.forbiddenWordsVisible ? "금지어 숨기기" : "금지어 공개"}
      >
        {runtime.forbiddenWordsVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        <span>{runtime.forbiddenWordsVisible ? "숨기기" : "공개"}</span>
      </button>
    </section>
  );
}

export const tabooModule: GameModule<TabooQuestion, NewGameSettings, TabooRuntime, TabooAction> = {
  id: "taboo",
  label: "설명 금지어",
  shortDescription: "지정된 금지어를 쓰지 않고 제시어를 설명합니다.",
  accent: "#d94f45",
  engine: "speed",
  questionSchema: tabooQuestionSchema,
  defaultSettings: {
    answerMode: "host",
    roundDurationSec: 60,
    previewDurationSec: 5,
    scorePerCorrect: 1,
    allowPass: true,
    wrongAnswerPolicy: "END_QUESTION",
  },
  instructions: {
    objective: "설명자는 화면의 금지어를 말하지 않고 팀원에게 제시어를 설명합니다.",
    steps: ["설명자만 제시어와 금지어를 확인합니다.", "진행자가 금지어를 숨기고 라운드를 시작합니다.", "팀원이 제시어를 맞히면 정답 처리합니다.", "금지어 사용이나 패스는 진행자가 판정합니다."],
    scoring: ["제한 시간 안에 맞힌 제시어마다 기본 1점입니다.", "금지어 사용 시 해당 문제는 점수를 주지 않습니다."],
    hostTips: ["설명자가 단어의 일부나 외국어 번역을 말하지 않게 확인하세요.", "TV를 보는 참가자가 제시어를 보지 않도록 설명자 확인 뒤 숨김 상태로 전환하세요."],
  },
  initialRuntime: { forbiddenWordsVisible: true },
  reduceRuntime: reduceTabooRuntime,
  getStageCount: () => 1,
  QuestionView: TabooView,
};
