import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Expand,
  Eye,
  Flag,
  Lightbulb,
  ListChecks,
  Pause,
  Play,
  RotateCcw,
  Settings,
  SkipForward,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { gameDefinitions, gameRegistry } from "./config/gameRegistry";
import { filterQuestions } from "./data/filter";
import { questionLoadErrors, questions, questionsForGame } from "./data/questions";
import type {
  FilterSettings,
  GameSettings,
  MvpGameType,
  MvpQuestion,
} from "./domain/types";
import { useGameTimer } from "./hooks/useGameTimer";
import { useSessionStore } from "./store/sessionStore";

const teamColorOptions = ["#e14d3a", "#3973c6", "#1e8f65", "#e29b23", "#8d5bb7"];

function ActionButton({
  icon,
  children,
  variant = "secondary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success";
}) {
  return (
    <button className={`button button--${variant}`} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

function App() {
  const screen = useSessionStore((state) => state.screen);
  useGameTimer();

  return (
    <div className="app-shell">
      {screen === "home" && <HomeScreen />}
      {screen === "session_setup" && <SessionSetupScreen />}
      {screen === "game_select" && <GameSelectScreen />}
      {screen === "game_intro" && <GameIntroScreen />}
      {screen === "game_setup" && <GameSetupScreen />}
      {screen === "game_play" && <GamePlayScreen />}
      {screen === "round_result" && <RoundResultScreen />}
      {screen === "scoreboard" && <ScoreboardScreen final={false} />}
      {screen === "final_result" && <ScoreboardScreen final />}
    </div>
  );
}

function HomeScreen() {
  const newSession = useSessionStore((state) => state.newSession);
  const setScreen = useSessionStore((state) => state.setScreen);
  const teams = useSessionStore((state) => state.teams);
  const hasProgress = teams.some((team) => team.score !== 0);

  return (
    <main className="home-screen">
      <section className="home-band">
        <div className="brand-mark" aria-hidden="true">Q</div>
        <p className="eyebrow">HOST CONSOLE</p>
        <h1>모두의 퀴즈룸</h1>
        <p className="home-copy">팀을 나누고, 게임을 고르고, 바로 시작하세요.</p>
        <div className="home-actions">
          <ActionButton variant="primary" icon={<Play size={22} />} onClick={newSession}>
            새 게임 시작
          </ActionButton>
          {hasProgress && (
            <ActionButton icon={<RotateCcw size={20} />} onClick={() => setScreen("game_select")}>
              진행 중인 세션
            </ActionButton>
          )}
        </div>
      </section>
      <section className="status-strip" aria-label="앱 상태">
        <span>6개 게임</span>
        <span>2~4팀</span>
        <span>오프라인 플레이</span>
        <span>Undo 지원</span>
      </section>
    </main>
  );
}

function SessionSetupScreen() {
  const teams = useSessionStore((state) => state.teams);
  const setTeamCount = useSessionStore((state) => state.setTeamCount);
  const updateTeam = useSessionStore((state) => state.updateTeam);
  const setScreen = useSessionStore((state) => state.setScreen);

  return (
    <ScreenFrame title="팀 설정" subtitle="오늘 플레이할 팀을 준비합니다.">
      <section className="setup-section">
        <div className="field-row field-row--spread">
          <div>
            <label className="field-label">팀 수</label>
            <p className="field-help">최대 4팀까지 함께 플레이할 수 있습니다.</p>
          </div>
          <div className="segment-control" aria-label="팀 수">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                className={teams.length === count ? "active" : ""}
                onClick={() => setTeamCount(count)}
              >
                {count}팀
              </button>
            ))}
          </div>
        </div>
        <div className="team-editor-grid">
          {teams.map((team, index) => (
            <div className="team-editor" key={team.id} style={{ borderTopColor: team.color }}>
              <span className="team-number">TEAM {index + 1}</span>
              <input
                aria-label={`${index + 1}번 팀 이름`}
                value={team.name}
                maxLength={12}
                onChange={(event) => updateTeam(team.id, { name: event.target.value, color: team.color })}
              />
              <div className="swatches" aria-label={`${team.name} 색상`}>
                {teamColorOptions.map((color) => (
                  <button
                    key={color}
                    className={team.color === color ? "swatch selected" : "swatch"}
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`${color} 선택`}
                    onClick={() => updateTeam(team.id, { name: team.name, color })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <footer className="screen-footer">
        <ActionButton icon={<ArrowLeft size={20} />} onClick={() => setScreen("home")}>뒤로</ActionButton>
        <ActionButton
          variant="primary"
          icon={<Check size={20} />}
          disabled={teams.some((team) => !team.name.trim())}
          onClick={() => setScreen("game_select")}
        >
          게임 선택
        </ActionButton>
      </footer>
    </ScreenFrame>
  );
}

function GameSelectScreen() {
  const selectedGameIds = useSessionStore((state) => state.selectedGameIds);
  const toggleGame = useSessionStore((state) => state.toggleGame);
  const selectGame = useSessionStore((state) => state.selectGame);
  const setScreen = useSessionStore((state) => state.setScreen);

  return (
    <ScreenFrame title="게임 선택" subtitle="플레이할 게임을 열어 세부 설정을 확인하세요.">
      {questionLoadErrors.length > 0 && (
        <div className="alert" role="alert">
          데이터 오류 {questionLoadErrors.length}건이 있습니다. 유효한 문제만 표시됩니다.
        </div>
      )}
      <section className="game-grid">
        {gameDefinitions.map((game, index) => {
          const count = questionsForGame(game.id).length;
          const selected = selectedGameIds.includes(game.id);
          return (
            <article className="game-card" key={game.id} style={{ borderTopColor: game.accent }}>
              <div className="game-card__topline">
                <span className="game-index">{String(index + 1).padStart(2, "0")}</span>
                <label className="check-control">
                  <input type="checkbox" checked={selected} onChange={() => toggleGame(game.id)} />
                  오늘 할 게임
                </label>
              </div>
              <h2>{game.label}</h2>
              <p>{game.shortDescription}</p>
              <div className="game-card__meta">
                <span>{game.engine.toUpperCase()}</span>
                <span>{count}문제</span>
              </div>
              <ActionButton
                variant="primary"
                icon={<BookOpen size={19} />}
                disabled={!selected}
                onClick={() => selectGame(game.id)}
              >
                게임 안내
              </ActionButton>
            </article>
          );
        })}
      </section>
      <footer className="screen-footer">
        <ActionButton icon={<Users size={20} />} onClick={() => setScreen("session_setup")}>팀 수정</ActionButton>
        <ActionButton icon={<Trophy size={20} />} onClick={() => setScreen("scoreboard")}>점수판</ActionButton>
      </footer>
    </ScreenFrame>
  );
}

function GameIntroScreen() {
  const currentGameId = useSessionStore((state) => state.currentGameId);
  const setScreen = useSessionStore((state) => state.setScreen);

  if (!currentGameId) return null;
  const game = gameRegistry[currentGameId];

  return (
    <ScreenFrame title={game.label} subtitle="게임을 시작하기 전에 진행 방식을 확인하세요.">
      <section className="game-guide" style={{ "--guide-accent": game.accent } as React.CSSProperties}>
        <div className="guide-objective">
          <span>어떤 게임인가요?</span>
          <strong>{game.guide.objective}</strong>
        </div>

        <div className="guide-flow">
          <h2><ListChecks size={22} /> 진행 순서</h2>
          <ol className="guide-steps">
            {game.guide.steps.map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="guide-details">
          <section>
            <h2><Trophy size={22} /> 채점 방식</h2>
            <ul>{game.guide.scoring.map((rule) => <li key={rule}>{rule}</li>)}</ul>
          </section>
          <section>
            <h2><Lightbulb size={22} /> 진행자 팁</h2>
            <ul>{game.guide.hostTips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
          </section>
        </div>
      </section>
      <footer className="screen-footer">
        <ActionButton icon={<ArrowLeft size={20} />} onClick={() => setScreen("game_select")}>게임 목록</ActionButton>
        <ActionButton variant="primary" icon={<Settings size={20} />} onClick={() => setScreen("game_setup")}>게임 설정</ActionButton>
      </footer>
    </ScreenFrame>
  );
}

function GameSetupScreen() {
  const currentGameId = useSessionStore((state) => state.currentGameId);
  const teams = useSessionStore((state) => state.teams);
  const currentTeamId = useSessionStore((state) => state.currentTeamId);
  const settingsByGame = useSessionStore((state) => state.settingsByGame);
  const filter = useSessionStore((state) => state.filter);
  const usedQuestionIds = useSessionStore((state) => state.usedQuestionIds);
  const selectTeam = useSessionStore((state) => state.selectTeam);
  const updateSettings = useSessionStore((state) => state.updateSettings);
  const updateFilter = useSessionStore((state) => state.updateFilter);
  const startRound = useSessionStore((state) => state.startRound);
  const setScreen = useSessionStore((state) => state.setScreen);
  const clearUsedQuestions = useSessionStore((state) => state.clearUsedQuestions);

  if (!currentGameId) return null;
  const game = gameRegistry[currentGameId];
  const settings = settingsByGame[currentGameId];
  const gameQuestions = questionsForGame(currentGameId);
  const categories = [...new Set(gameQuestions.map((question) => question.category))].sort();
  const queue = filterQuestions(gameQuestions, filter, usedQuestionIds);

  return (
    <ScreenFrame title={game.label} subtitle={game.shortDescription}>
      <section className="setup-columns">
        <div className="settings-panel">
          <h2>라운드 설정</h2>
          <label className="field-label">도전 팀</label>
          <div className="team-segments">
            {teams.map((team) => (
              <button
                key={team.id}
                className={currentTeamId === team.id ? "active" : ""}
                style={{ "--team-color": team.color } as React.CSSProperties}
                onClick={() => selectTeam(team.id)}
              >
                {team.name}
              </button>
            ))}
          </div>
          <SettingsFields gameId={currentGameId} settings={settings} updateSettings={updateSettings} />
        </div>
        <div className="settings-panel">
          <h2>문제 필터</h2>
          <FilterFields filter={filter} categories={categories} updateFilter={updateFilter} />
          <div className="question-count">
            <strong>{queue.length}</strong>
            <span>개 문제 사용 가능</span>
          </div>
          {queue.length === 0 && (
            <p className="inline-error">조건에 맞는 문제가 없습니다. 필터 또는 사용 기록을 조정하세요.</p>
          )}
          <button className="text-button" onClick={clearUsedQuestions}>사용 기록 초기화</button>
        </div>
      </section>
      <footer className="screen-footer">
        <ActionButton icon={<ArrowLeft size={20} />} onClick={() => setScreen("game_select")}>게임 목록</ActionButton>
        <ActionButton icon={<BookOpen size={20} />} onClick={() => setScreen("game_intro")}>게임 안내</ActionButton>
        <ActionButton
          variant="primary"
          icon={<Play size={20} />}
          disabled={queue.length === 0}
          onClick={() => startRound(queue.map((question) => question.id))}
        >
          라운드 시작
        </ActionButton>
      </footer>
    </ScreenFrame>
  );
}

function SettingsFields({
  gameId,
  settings,
  updateSettings,
}: {
  gameId: MvpGameType;
  settings: GameSettings;
  updateSettings: (id: MvpGameType, updates: Partial<GameSettings>) => void;
}) {
  const game = gameRegistry[gameId];
  const numericField = (
    key: keyof GameSettings,
    label: string,
    min: number,
    max: number,
  ) => (
    <label className="number-field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={Number(settings[key] ?? min)}
        onChange={(event) => updateSettings(gameId, { [key]: Number(event.target.value) })}
      />
    </label>
  );

  return (
    <div className="field-stack">
      {game.engine === "speed" && numericField("roundDurationSec", "라운드 시간 (초)", 10, 600)}
      {game.engine === "standard" && numericField("questionDurationSec", "문제 시간 (초)", 1, 120)}
      {game.engine === "progressive" && numericField("stageDurationSec", "힌트별 시간 (초)", 1, 120)}
      {game.engine === "speed" && numericField("scorePerCorrect", "정답 점수", 1, 100)}
      {game.engine === "standard" && numericField("scoreOnSuccess", "성공 점수", 1, 100)}
      {gameId === "three_in_time" && numericField("requiredCount", "필요 답변 수", 1, 10)}
      {game.engine === "progressive" && (
        <label className="number-field number-field--wide">
          <span>단계별 점수</span>
          <input
            value={(settings.stageScores ?? [3, 2, 1]).join(", ")}
            onChange={(event) => {
              const values = event.target.value
                .split(",")
                .map((value) => Number(value.trim()))
                .filter((value) => Number.isFinite(value) && value >= 0);
              if (values.length) updateSettings(gameId, { stageScores: values });
            }}
          />
        </label>
      )}
      <label className="select-field">
        <span>오답 처리</span>
        <select
          value={settings.wrongAnswerPolicy}
          onChange={(event) => updateSettings(gameId, {
            wrongAnswerPolicy: event.target.value as GameSettings["wrongAnswerPolicy"],
          })}
        >
          <option value="STEAL">상대팀 기회</option>
          <option value="RETRY_SAME_TEAM">같은 팀 재도전</option>
          <option value="END_QUESTION">문제 종료</option>
          <option value="HOST_DECIDES">사회자가 선택</option>
        </select>
      </label>
      {(game.engine === "speed") && (
        <label className="toggle-control">
          <input
            type="checkbox"
            checked={settings.allowPass ?? false}
            onChange={(event) => updateSettings(gameId, { allowPass: event.target.checked })}
          />
          패스 허용
        </label>
      )}
    </div>
  );
}

function FilterFields({
  filter,
  categories,
  updateFilter,
}: {
  filter: FilterSettings;
  categories: string[];
  updateFilter: (updates: Partial<FilterSettings>) => void;
}) {
  return (
    <div className="field-stack">
      <div className="difficulty-fields">
        <label className="number-field">
          <span>최소 난이도</span>
          <input type="number" min="1" max="5" value={filter.difficultyMin} onChange={(event) => updateFilter({ difficultyMin: Number(event.target.value) })} />
        </label>
        <label className="number-field">
          <span>최대 난이도</span>
          <input type="number" min="1" max="5" value={filter.difficultyMax} onChange={(event) => updateFilter({ difficultyMax: Number(event.target.value) })} />
        </label>
      </div>
      <label className="select-field">
        <span>카테고리</span>
        <select value={filter.category} onChange={(event) => updateFilter({ category: event.target.value })}>
          <option value="">전체</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <label className="select-field">
        <span>문제 순서</span>
        <select value={filter.questionOrder} onChange={(event) => updateFilter({ questionOrder: event.target.value as FilterSettings["questionOrder"] })}>
          <option value="random">랜덤</option>
          <option value="data">데이터 순서</option>
        </select>
      </label>
      <label className="toggle-control"><input type="checkbox" checked={filter.verifiedOnly} onChange={(event) => updateFilter({ verifiedOnly: event.target.checked })} />검증된 문제만</label>
      <label className="toggle-control"><input type="checkbox" checked={filter.excludeUsedQuestions} onChange={(event) => updateFilter({ excludeUsedQuestions: event.target.checked })} />사용한 문제 제외</label>
    </div>
  );
}

function GamePlayScreen() {
  const state = useSessionStore();
  const dispatch = useSessionStore((store) => store.dispatch);
  const currentQuestionId = state.questionQueue[state.questionIndex];
  const question = questions.find((item) => item.id === currentQuestionId);
  const game = state.currentGameId ? gameRegistry[state.currentGameId] : null;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
      if (event.code === "Space") {
        event.preventDefault();
        dispatch({ type: state.timerStatus === "running" ? "PAUSE" : state.timerStatus === "paused" ? "RESUME" : "START" });
      } else if (event.key.toLowerCase() === "p") dispatch({ type: "PASS" });
      else if (event.key.toLowerCase() === "n") dispatch({ type: "NEXT" });
      else if (event.key.toLowerCase() === "u") dispatch({ type: "UNDO" });
      else if (/^[1-4]$/.test(event.key)) {
        const team = state.teams[Number(event.key) - 1];
        if (team) dispatch({ type: "CORRECT", teamId: team.id });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, state.teams, state.timerStatus]);

  if (!game || !question) return null;
  const currentTeam = state.teams.find((team) => team.id === state.currentTeamId) ?? state.teams[0];
  const totalSeconds = Math.ceil(state.remainingMs / 1000);
  const urgent = totalSeconds <= 10;

  return (
    <main className="play-screen">
      <header className="play-header">
        <div className="play-identity">
          <span className="live-dot" />
          <div><span>ROUND {state.roundNumber}</span><strong>{game.label}</strong></div>
        </div>
        <div className="score-ribbon">
          {state.teams.map((team) => (
            <div key={team.id} className={team.id === state.currentTeamId ? "score-team active" : "score-team"} style={{ borderColor: team.color }}>
              <span>{team.name}</span><strong>{team.score}</strong>
            </div>
          ))}
        </div>
        <div className={urgent ? "timer timer--urgent" : "timer"} aria-live="polite">
          <span>{state.timerStatus === "expired" ? "TIME" : "남은 시간"}</span>
          <strong>{formatTime(totalSeconds)}</strong>
        </div>
        <button className="icon-button" title="전체 화면" aria-label="전체 화면" onClick={() => document.documentElement.requestFullscreen?.()}><Expand size={22} /></button>
      </header>

      <section className="question-stage" style={{ "--accent": game.accent } as React.CSSProperties}>
        <div className="turn-indicator" style={{ color: currentTeam.color }}>{currentTeam.name} 도전</div>
        <QuestionContent question={question} stageIndex={state.stageIndex} revealed={state.revealed} />
        {state.revealed && question.answer && (
          <div className="answer-reveal"><span>정답</span><strong>{question.answer}</strong></div>
        )}
      </section>

      {state.pendingDecision && (
        <aside className="decision-bar" aria-label="오답 처리 선택">
          <strong>다음 행동을 선택하세요</strong>
          {state.teams.filter((team) => team.id !== state.currentTeamId).map((team) => (
            <ActionButton key={team.id} onClick={() => dispatch({ type: "STEAL", teamId: team.id })}>{team.name} 기회</ActionButton>
          ))}
          <ActionButton onClick={() => dispatch({ type: "RETRY" })}>재도전</ActionButton>
          <ActionButton onClick={() => dispatch({ type: "REVEAL" })}>문제 종료</ActionButton>
        </aside>
      )}

      <footer className="host-controls">
        <div className="control-group">
          <button className="icon-button icon-button--large" title="실행 취소 (U)" aria-label="실행 취소" disabled={state.history.length === 0} onClick={() => dispatch({ type: "UNDO" })}><RotateCcw size={25} /></button>
          <button className="icon-button icon-button--large" title="라운드 종료" aria-label="라운드 종료" onClick={() => dispatch({ type: "END" })}><Flag size={25} /></button>
        </div>
        <div className="control-group control-group--center">
          {state.timerStatus !== "running" ? (
            <ActionButton variant="primary" icon={<Play size={24} />} disabled={state.timerStatus === "expired"} onClick={() => dispatch({ type: state.timerStatus === "paused" ? "RESUME" : "START" })}>시작</ActionButton>
          ) : (
            <ActionButton icon={<Pause size={24} />} onClick={() => dispatch({ type: "PAUSE" })}>일시정지</ActionButton>
          )}
          {!state.revealed && (
            <>
              {(game.engine === "speed" ? [currentTeam] : state.teams).map((team) => (
                <button key={team.id} className="team-correct-button" style={{ backgroundColor: team.color }} onClick={() => dispatch({ type: "CORRECT", teamId: team.id })}>
                  <Check size={25} /><span>{team.name} 정답</span>
                </button>
              ))}
              <ActionButton variant="danger" icon={<X size={24} />} onClick={() => dispatch({ type: "WRONG" })}>오답</ActionButton>
            </>
          )}
          {game.engine === "progressive" && !state.revealed && (
            <ActionButton icon={<SkipForward size={23} />} onClick={() => dispatch({ type: "NEXT_STAGE" })}>다음 힌트</ActionButton>
          )}
          {state.settingsByGame[game.id].allowPass && !state.revealed && (
            <ActionButton icon={<SkipForward size={23} />} onClick={() => dispatch({ type: "PASS" })}>패스</ActionButton>
          )}
          {!state.revealed && game.engine !== "speed" && (
            <ActionButton icon={<Eye size={23} />} onClick={() => dispatch({ type: "REVEAL" })}>정답 공개</ActionButton>
          )}
          {state.revealed && (
            <ActionButton variant="primary" icon={<SkipForward size={23} />} onClick={() => dispatch({ type: "NEXT" })}>다음 문제</ActionButton>
          )}
        </div>
        <div className="question-progress">{state.questionIndex + 1} / {state.questionQueue.length}</div>
      </footer>
    </main>
  );
}

function QuestionContent({ question, stageIndex, revealed }: { question: MvpQuestion; stageIndex: number; revealed: boolean }) {
  if (question.gameType === "person_quiz") {
    return (
      <div className="person-question">
        <AssetImage key={question.id} src={question.asset} alt="맞힐 인물" fallback={question.metadata?.clue ?? "인물 이미지가 준비되지 않았습니다."} />
      </div>
    );
  }
  if (question.gameType === "charades") {
    return <div className="word-question"><span>제시어</span><strong>{question.answer}</strong></div>;
  }
  if (question.gameType === "four_syllable") {
    return <div className="word-question"><span>뒤의 두 글자는?</span><strong>{question.metadata.prompt}<i>··</i></strong>{revealed && <small>{question.metadata.fullAnswer}</small>}</div>;
  }
  if (question.gameType === "three_in_time") {
    return <div className="prompt-question"><span>{question.metadata.requiredCount}개 말하기</span><strong>{question.metadata.prompt}</strong></div>;
  }
  if (question.gameType === "progressive_hint") {
    return <ol className="hint-list">{question.metadata.hints.slice(0, stageIndex + 1).map((hint, index) => <li key={hint}><span>힌트 {index + 1}</span><strong>{hint}</strong></li>)}</ol>;
  }
  if (question.gameType === "football_career") {
    const indexes = question.metadata.revealStages[Math.min(stageIndex, question.metadata.revealStages.length - 1)] ?? [];
    return <div className="career-path">{indexes.map((index, itemIndex) => <div key={`${index}-${itemIndex}`}><span>{itemIndex + 1}</span><strong>{question.metadata.career[index]?.club}</strong></div>)}</div>;
  }
  return null;
}

function AssetImage({ src, alt, fallback }: { src?: string | null; alt: string; fallback: string }) {
  const [failed, setFailed] = useState(!src);
  if (failed) return <div className="asset-fallback"><Users size={64} /><strong>{fallback}</strong><span>에셋을 추가하면 자동으로 표시됩니다.</span></div>;
  const path = `${import.meta.env.BASE_URL}${src!.replace(/^\//, "")}`;
  return <img src={path} alt={alt} onError={() => setFailed(true)} />;
}

function RoundResultScreen() {
  const teams = useSessionStore((state) => state.teams);
  const roundScores = useSessionStore((state) => state.roundScores);
  const currentGameId = useSessionStore((state) => state.currentGameId);
  const setScreen = useSessionStore((state) => state.setScreen);
  const selectTeam = useSessionStore((state) => state.selectTeam);
  const currentTeamId = useSessionStore((state) => state.currentTeamId);
  const nextIndex = (teams.findIndex((team) => team.id === currentTeamId) + 1) % teams.length;

  return (
    <ScreenFrame title="라운드 결과" subtitle={currentGameId ? gameRegistry[currentGameId].label : ""}>
      <section className="result-list">
        {teams.map((team) => (
          <div key={team.id} style={{ borderLeftColor: team.color }}>
            <span>{team.name}</span><strong>+{roundScores[team.id] ?? 0}</strong><em>총 {team.score}점</em>
          </div>
        ))}
      </section>
      <footer className="screen-footer">
        <ActionButton onClick={() => setScreen("scoreboard")} icon={<Trophy size={20} />}>전체 점수판</ActionButton>
        <ActionButton variant="primary" onClick={() => { selectTeam(teams[nextIndex].id); setScreen("game_setup"); }} icon={<Play size={20} />}>다음 팀 라운드</ActionButton>
        <ActionButton onClick={() => setScreen("game_select")} icon={<SkipForward size={20} />}>다른 게임</ActionButton>
      </footer>
    </ScreenFrame>
  );
}

function ScoreboardScreen({ final }: { final: boolean }) {
  const teams = useSessionStore((state) => state.teams);
  const setScreen = useSessionStore((state) => state.setScreen);
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <ScreenFrame title={final ? "최종 결과" : "세션 점수판"} subtitle={final ? "오늘의 우승팀을 확인하세요." : "게임 사이에도 점수는 계속 유지됩니다."}>
      <section className={final ? "leaderboard leaderboard--final" : "leaderboard"}>
        {sortedTeams.map((team, index) => (
          <div key={team.id} className="leaderboard-row" style={{ borderColor: team.color }}>
            <span className="rank">{index + 1}</span>
            <strong>{team.name}</strong>
            <em>{team.score}점</em>
          </div>
        ))}
      </section>
      <footer className="screen-footer">
        {!final && <ActionButton icon={<ArrowLeft size={20} />} onClick={() => setScreen("game_select")}>게임 선택</ActionButton>}
        {!final && <ActionButton variant="primary" icon={<Trophy size={20} />} onClick={() => setScreen("final_result")}>최종 결과</ActionButton>}
        {final && <ActionButton variant="primary" icon={<RotateCcw size={20} />} onClick={() => setScreen("home")}>처음 화면</ActionButton>}
      </footer>
    </ScreenFrame>
  );
}

function ScreenFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="screen-frame">
      <header className="screen-heading"><p className="eyebrow">QUIZ ROOM</p><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</header>
      {children}
    </main>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default App;
