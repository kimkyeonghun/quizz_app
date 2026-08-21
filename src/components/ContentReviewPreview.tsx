import { useState } from "react";
import { NewGameQuestionContent, getNewGameStageCount, initialNewGameRuntime } from "../adapters/NewGameQuestionContent";
import { MVP_GAME_TYPES, type MvpQuestion, type PlayableQuestion } from "../domain/types";

function isNewGameQuestion(question: PlayableQuestion): question is Exclude<PlayableQuestion, MvpQuestion> {
  return !(MVP_GAME_TYPES as readonly string[]).includes(question.gameType);
}

export function ContentReviewPreview({ question }: { question: PlayableQuestion }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  if (!isNewGameQuestion(question)) return null;
  const stageCount = getNewGameStageCount(question);

  return (
    <section className="content-review-preview" aria-label={`${question.id} 미디어 미리보기`}>
      <div className="content-review-controls">
        <strong>미디어 미리보기</strong>
        {stageCount > 1 && (
          <label>
            <span>공개 단계</span>
            <input aria-label="미리보기 공개 단계" type="range" min="1" max={stageCount} value={stageIndex + 1}
              onChange={(event) => setStageIndex(Number(event.target.value) - 1)} />
            <em>{stageIndex + 1} / {stageCount}</em>
          </label>
        )}
        <label><input type="checkbox" checked={revealed} onChange={(event) => setRevealed(event.target.checked)} />정답 공개 상태</label>
        {question.gameType === "music_intro" && (
          <span>재생 구간 {question.metadata.clipStartSec.toFixed(1)}초 ~ {(question.metadata.clipStartSec + question.metadata.clipDurationsSec[stageIndex]).toFixed(1)}초</span>
        )}
      </div>
      <div className="content-review-media">
        <NewGameQuestionContent question={question} stageIndex={stageIndex} revealed={revealed}
          runtime={initialNewGameRuntime(question.gameType)} dispatch={() => undefined} />
      </div>
    </section>
  );
}
