/* eslint-disable react-refresh/only-export-components */
import type { GameModule, NewGameSettings } from "../contracts";
import { keepRuntime, noopRuntime } from "../contracts";
import { MediaFrame, VisualAsset } from "../shared/VisualAsset";
import styles from "../shared/MediaFrame.module.css";
import { moviePosterQuestionSchema, type MoviePosterQuestion } from "./schema";
export { moviePosterQuestionSchema, type MoviePosterQuestion } from "./schema";
type MovieRuntime = typeof noopRuntime;
type MovieAction = { type: "RESET" };

function MoviePosterView({ question, revealed }: { question: MoviePosterQuestion; revealed: boolean }) {
  const hasRuntimeMasks = question.metadata.titleMasks.length > 0;
  return (
    <MediaFrame>
      {hasRuntimeMasks ? (
        <div
          className={styles.posterSurface}
          style={{ aspectRatio: `${question.metadata.posterAspectRatio.width} / ${question.metadata.posterAspectRatio.height}` }}
        >
          <VisualAsset
            asset={question.asset}
            symbolId={question.metadata.symbolId}
            alt={revealed ? `${question.answer} 포스터` : "제목이 가려진 영화 포스터"}
          />
          {!revealed && question.metadata.titleMasks.map((mask, index) => (
            <span
              aria-hidden="true"
              className={mask.mode === "BLUR" ? styles.posterMaskBlur : styles.posterMaskBlank}
              key={`${mask.x}-${mask.y}-${index}`}
              style={{ left: `${mask.x}%`, top: `${mask.y}%`, width: `${mask.width}%`, height: `${mask.height}%` }}
            />
          ))}
        </div>
      ) : (
        <VisualAsset
          asset={question.asset}
          symbolId={question.metadata.symbolId}
          alt={revealed ? `${question.answer} 포스터` : "제목이 가려진 영화 포스터"}
        />
      )}
      {revealed && <p className={styles.revealMeta}>{question.metadata.releaseYear} · {question.metadata.country}</p>}
    </MediaFrame>
  );
}

export const moviePosterModule: GameModule<MoviePosterQuestion, NewGameSettings, MovieRuntime, MovieAction> = {
  id: "movie_poster",
  label: "영화 포스터",
  shortDescription: "제목이 가려진 포스터만 보고 영화 제목을 맞힙니다.",
  accent: "#2d756f",
  engine: "media",
  questionSchema: moviePosterQuestionSchema,
  defaultSettings: {
    questionDurationSec: 20,
    scoreOnSuccess: 1,
    allowPass: false,
    wrongAnswerPolicy: "STEAL",
  },
  instructions: {
    objective: "글자를 제거한 포스터의 구도와 소재를 보고 영화 제목을 맞힙니다.",
    steps: ["포스터를 공개합니다.", "현재 팀이 영화 제목을 말합니다.", "진행자가 답을 판정합니다.", "정답 공개 후 다음 포스터로 이동합니다."],
    scoring: ["정답은 기본 1점입니다.", "연도와 국가는 정답 공개 뒤 보조 정보로만 사용합니다."],
    hostTips: ["한국 포스터의 한글 제목 영역은 BLUR 또는 BLANK 마스크로 지정하세요.", "포스터 파일명이나 대체 텍스트가 답을 노출하지 않게 하세요.", "원제와 국내 개봉명은 허용 답안에 함께 등록하세요."],
  },
  initialRuntime: noopRuntime,
  reduceRuntime: keepRuntime,
  getStageCount: () => 1,
  QuestionView: MoviePosterView,
};
