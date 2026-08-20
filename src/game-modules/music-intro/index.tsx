/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import type { GameModule, GameQuestionProps, NewGameSettings } from "../contracts";
import { keepRuntime, noopRuntime } from "../contracts";
import styles from "../shared/MediaFrame.module.css";
import { musicIntroQuestionSchema, type MusicIntroQuestion } from "./schema";
export { musicIntroQuestionSchema, type MusicIntroQuestion } from "./schema";
type MusicRuntime = typeof noopRuntime;
type MusicAction = { type: "RESET" };

function assetUrl(asset: string): string {
  return `${import.meta.env.BASE_URL}${asset.replace(/^\//, "")}`;
}

function MusicIntroView({ question, stageIndex }: GameQuestionProps<MusicIntroQuestion, MusicRuntime, MusicAction>) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState("");
  const duration = question.metadata.clipDurationsSec[Math.min(stageIndex, question.metadata.clipDurationsSec.length - 1)] ?? 3;
  const clipEnd = question.metadata.clipStartSec + duration;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = question.metadata.clipStartSec;
    setPlaying(false);
    setError("");
  }, [question.id, question.metadata.clipStartSec, stageIndex]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    if (audio.currentTime < question.metadata.clipStartSec || audio.currentTime >= clipEnd) {
      audio.currentTime = question.metadata.clipStartSec;
    }
    try {
      await audio.play();
      setPlaying(true);
      setError("");
    } catch {
      setPlaying(false);
      setError("오디오 재생을 시작하지 못했습니다.");
    }
  };

  return (
    <section className={styles.audioPanel} style={{ "--module-accent": "#db9e28" } as React.CSSProperties}>
      <p className={styles.audioTitle}>전주 {duration}초</p>
      <div className={styles.waveform} aria-hidden="true">
        {[26, 55, 82, 44, 68, 92, 36, 74, 50, 86, 42, 64, 30, 72, 48, 88].map((height, index) => (
          <span key={index} style={{ "--bar-height": `${height}%` } as React.CSSProperties} />
        ))}
      </div>
      <audio
        ref={audioRef}
        src={assetUrl(question.asset)}
        preload="metadata"
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setError("오디오 파일을 불러올 수 없습니다.")}
        onTimeUpdate={(event) => {
          if (event.currentTarget.currentTime >= clipEnd) {
            event.currentTarget.pause();
            event.currentTarget.currentTime = question.metadata.clipStartSec;
          }
        }}
      />
      <div className={styles.mediaControls}>
        <button className={styles.iconButton} type="button" onClick={togglePlayback} title={playing ? "일시정지" : "전주 재생"} aria-label={playing ? "일시정지" : "전주 재생"}>
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
        <Volume2 aria-hidden="true" />
        <input className={styles.volume} type="range" min="0" max="1" step="0.05" value={volume} aria-label="음량" onChange={(event) => setVolume(Number(event.target.value))} />
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </section>
  );
}

export const musicIntroModule: GameModule<MusicIntroQuestion, NewGameSettings, MusicRuntime, MusicAction> = {
  id: "music_intro",
  label: "음악 전주",
  shortDescription: "짧게 재생되는 전주를 듣고 곡 제목을 맞힙니다.",
  accent: "#db9e28",
  engine: "media",
  questionSchema: musicIntroQuestionSchema,
  defaultSettings: {
    stageDurationSec: 5,
    stageScores: [3, 2, 1],
    allowPass: false,
    wrongAnswerPolicy: "STEAL",
  },
  instructions: {
    objective: "처음에는 짧게, 다음 단계에서는 더 길게 전주를 듣고 곡 제목을 맞힙니다.",
    steps: ["진행자가 재생 버튼을 누릅니다.", "현재 팀의 답을 받습니다.", "정답이 없으면 다음 길이로 재생합니다.", "곡명과 아티스트를 공개합니다."],
    scoring: ["첫 재생 3점, 두 번째 2점, 마지막 1점이 기본입니다.", "재생 단계가 늘어날수록 배점이 낮아집니다."],
    hostTips: ["게임 전에 기기 음량을 확인하세요.", "재생은 진행자의 클릭으로만 시작되므로 브라우저 자동재생 설정이 필요 없습니다."],
  },
  initialRuntime: noopRuntime,
  reduceRuntime: keepRuntime,
  getStageCount: (question) => question.metadata.clipDurationsSec.length,
  QuestionView: MusicIntroView,
};
