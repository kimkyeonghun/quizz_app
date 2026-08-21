import { lazy, Suspense, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  Expand,
  Eye,
  Flag,
  Lightbulb,
  ListChecks,
  MonitorUp,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings,
  SkipForward,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { availableGameDefinitions, getPlayableGameDefinition, playableGameRegistry } from "./adapters/newGames";
import { getNewGameStageCount, NewGameQuestionContent } from "./adapters/NewGameQuestionContent";
import { ContentReviewPreview } from "./components/ContentReviewPreview";
import { filterQuestions } from "./data/filter";
import { preflightQuestions, type MediaPreflightFailure } from "./data/mediaPreflight";
import { questionBundle, questionLoadErrors, questionLoadIssues, questions, questionsForGame } from "./data/questions";
import type {
  FilterSettings,
  GameSettings,
  GameType,
  MvpQuestion,
  PlayableQuestion,
} from "./domain/types";
import { MVP_GAME_TYPES } from "./domain/types";
import { answerMatchesQuestion } from "./domain/answerMatching";
import { useGameTimer } from "./hooks/useGameTimer";
import { useSessionStore } from "./store/sessionStore";

const teamColorOptions = ["#e14d3a", "#3973c6", "#1e8f65", "#e29b23", "#8d5bb7"];
const DataAdminScreen = lazy(() => import("./screens/DataAdminScreen"));

function isMvpQuestion(question: PlayableQuestion): question is MvpQuestion {
  return (MVP_GAME_TYPES as readonly string[]).includes(question.gameType);
}

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
      {screen === "data_admin" && <Suspense fallback={<main className="admin-screen"><p>데이터 화면을 불러오는 중입니다.</p></main>}><DataAdminScreen /></Suspense>}
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
          <ActionButton icon={<Database size={20} />} onClick={() => setScreen("data_admin")}>
            문제 데이터 관리
          </ActionButton>
          {hasProgress && (
            <ActionButton icon={<RotateCcw size={20} />} onClick={() => setScreen("game_select")}>
              진행 중인 세션
            </ActionButton>
          )}
        </div>
      </section>
      <section className="status-strip" aria-label="앱 상태">
        <span>{availableGameDefinitions.length}개 게임</span>
        <span>2~4팀</span>
        <span>오프라인 플레이</span>
        <span>Undo 지원</span>
      </section>
    </main>
  );
}

export function LegacyDataAdminScreen() {
  const setScreen = useSessionStore((state) => state.setScreen);
  const [gameId, setGameId] = useState<GameType>("person_quiz");
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");
  const [scope, setScope] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const gameQuestions = questionsForGame(gameId);
  const categories = [...new Set(gameQuestions.map((question) => question.category))].sort();
  const normalizedQuery = query.normalize("NFC").trim().toLocaleLowerCase("ko-KR");
  const filtered = gameQuestions.filter((question) => {
    if (difficulty !== "all" && question.difficulty !== Number(difficulty)) return false;
    if (category !== "all" && question.category !== category) return false;
    const usageScope = isMvpQuestion(question) ? question.usageScope : "redistributable";
    if (scope === "private" && usageScope !== "private_only") return false;
    if (scope === "redistributable" && usageScope === "private_only") return false;
    if (!normalizedQuery) return true;
    const searchable = [question.id, question.answer ?? "", ...(question.acceptedAnswers ?? []), question.category,
      questionPrompt(question), JSON.stringify(question.metadata ?? {})].join(" ").normalize("NFC").toLocaleLowerCase("ko-KR");
    return searchable.includes(normalizedQuery);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageQuestions = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const totalPrivate = questions.filter((question) => isMvpQuestion(question) && question.usageScope === "private_only").length;

  const changeGame = (nextGameId: GameType) => {
    setGameId(nextGameId); setQuery(""); setDifficulty("all"); setCategory("all"); setScope("all"); setPage(1);
  };

  return <main className="admin-screen">
    <header className="admin-heading">
      <div><p className="eyebrow">DATA ADMIN</p><h1>문제 데이터 관리</h1><p>게임별 문항, 정답, 메타데이터와 출처를 확인합니다.</p></div>
      <ActionButton icon={<ArrowLeft size={20} />} onClick={() => setScreen("home")}>홈으로</ActionButton>
    </header>

    <section className="admin-overview" aria-label="데이터 현황">
      <div><span>전체 문항</span><strong>{questions.length}</strong></div>
      <div><span>활성·검수</span><strong>{questions.filter((question) => question.enabled && question.verified).length}</strong></div>
      <div><span>로컬 전용</span><strong>{totalPrivate}</strong></div>
      <div className={questionLoadErrors.length ? "has-errors" : ""}><span>로드 오류</span><strong>{questionLoadErrors.length}</strong></div>
    </section>

    <p className="admin-profile">콘텐츠 프로필: <strong>{questionBundle.profile}</strong></p>
    {questionLoadIssues.length > 0 && (
      <section className="content-issue-list" aria-label="콘텐츠 로드 오류">
        <h2>콘텐츠 로드 오류</h2>
        {questionLoadIssues.map((issue, index) => (
          <article key={`${issue.file}-${issue.index}-${issue.path}-${index}`}>
            <strong>{issue.code}</strong>
            <span>{issue.file}{issue.index === undefined ? "" : `[${issue.index}]`}</span>
            {issue.questionId && <span>ID: {issue.questionId}</span>}
            {issue.path && <code>{issue.path}</code>}
            <p>{issue.message}</p>
          </article>
        ))}
      </section>
    )}

    <nav className="admin-game-tabs" aria-label="게임별 데이터">
      {Object.values(playableGameRegistry).map((game) => {
        const count = questionsForGame(game.id).length;
        return <button key={game.id} aria-label={`${game.label} ${count}문항`} className={gameId === game.id ? "active" : ""} style={{ "--tab-accent": game.accent } as React.CSSProperties}
          onClick={() => changeGame(game.id)}><span>{game.label}</span><strong>{count}</strong></button>;
      })}
    </nav>

    <section className="admin-toolbar" aria-label="문항 필터">
      <label className="admin-search"><Search size={18} /><input aria-label="문항 검색" value={query} placeholder="ID, 문제, 정답, 별칭 검색"
        onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
      <label><span>난이도</span><select aria-label="관리 난이도" value={difficulty} onChange={(event) => { setDifficulty(event.target.value); setPage(1); }}>
        <option value="all">전체</option>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}</option>)}
      </select></label>
      <label><span>분류</span><select aria-label="관리 분류" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
        <option value="all">전체</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}
      </select></label>
      <label><span>이용 범위</span><select aria-label="관리 이용 범위" value={scope} onChange={(event) => { setScope(event.target.value); setPage(1); }}>
        <option value="all">전체</option><option value="redistributable">재배포 가능</option><option value="private">로컬 전용</option>
      </select></label>
    </section>

    <div className="admin-list-heading"><div><strong>{getPlayableGameDefinition(gameId).label}</strong><span>{filtered.length}개 표시</span></div><span>행을 열어 전체 데이터와 출처를 확인하세요.</span></div>
    <section className="admin-question-list" aria-label={`${getPlayableGameDefinition(gameId).label} 문제 목록`}>
      {pageQuestions.length ? pageQuestions.map((question, index) => <AdminQuestionRow key={question.id} question={question} number={(safePage - 1) * pageSize + index + 1} />)
        : <div className="admin-empty"><Search size={34} /><strong>조건에 맞는 문항이 없습니다.</strong></div>}
    </section>

    <footer className="admin-pagination">
      <button aria-label="이전 페이지" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={20} /></button>
      <span>{safePage} / {totalPages}</span>
      <button aria-label="다음 페이지" disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight size={20} /></button>
    </footer>
  </main>;
}

function AdminQuestionRow({ question, number }: { question: PlayableQuestion; number: number }) {
  return <details className="admin-question-row">
    <summary>
      <span className="admin-row-number">{number}</span>
      {question.asset ? <img src={`${import.meta.env.BASE_URL}${question.asset.replace(/^\//, "")}`} alt="" /> : <span className="admin-no-asset">TEXT</span>}
      <span className="admin-row-main"><small>{question.id}</small><strong>{questionPrompt(question)}</strong></span>
      <span className="admin-row-answer"><small>정답</small><strong>{questionAnswer(question)}</strong></span>
      <span className="admin-row-meta"><em>난이도 {question.difficulty}</em><em>{question.category}</em>
        {isMvpQuestion(question) && question.usageScope === "private_only" && <em className="private">로컬 전용</em>}</span>
    </summary>
    <div className="admin-question-detail">
      <section><h3>문항 데이터</h3><QuestionMetadata question={question} />
        {question.acceptedAnswers?.length ? <p><strong>허용 답안</strong>{question.acceptedAnswers.join(" · ")}</p> : null}
        {question.tags?.length ? <p><strong>태그</strong>{question.tags.join(" · ")}</p> : null}
      </section>
      <section><h3>출처·권한</h3>
        {isMvpQuestion(question) && question.attribution && <p><strong>이미지</strong><a href={question.attribution.sourceUrl} target="_blank" rel="noreferrer">원본 페이지</a> · {question.attribution.license} · {question.attribution.accessedAt}</p>}
        {isMvpQuestion(question) && question.sources?.map((source) => <p key={source.url}><strong>{source.publisher}</strong><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> · {source.accessedAt}</p>)}
        {!isMvpQuestion(question) && "license" in question.metadata && <p><strong>미디어</strong>{String(question.metadata.license)} · {String(question.metadata.credit)}</p>}
        {question.source && <p><a href={question.source} target="_blank" rel="noreferrer">문항 출처</a></p>}
        {!question.source && (!isMvpQuestion(question) || (!question.attribution && !question.sources?.length)) && <p className="admin-muted">등록된 외부 출처가 없는 자체 작성 문항입니다.</p>}
      </section>
      <ContentReviewPreview question={question} />
    </div>
  </details>;
}

function QuestionMetadata({ question }: { question: PlayableQuestion }) {
  if (question.gameType === "person_quiz") return <p><strong>힌트</strong>{question.metadata?.clue ?? "없음"}</p>;
  if (question.gameType === "charades") return <p><strong>제시어</strong>{question.answer}</p>;
  if (question.gameType === "four_syllable") return <p><strong>앞말 / 완성어</strong>{question.metadata.prompt} / {question.metadata.fullAnswer}</p>;
  if (question.gameType === "three_in_time") return <><p><strong>판정 예시</strong>{question.metadata.examples.join(" · ")}</p><p><strong>판정 기준</strong>{question.metadata.judgingNotes}</p></>;
  if (question.gameType === "progressive_hint") return <ol className="admin-stage-list">{question.metadata.hints.map((hint) => <li key={hint}>{hint}</li>)}</ol>;
  if (question.gameType === "football_career") return <ol className="admin-stage-list">{question.metadata.career.map((entry) => <li key={`${entry.order}-${entry.club}`}>{entry.club}</li>)}</ol>;
  if (question.gameType === "music_intro") return <p><strong>아티스트 / 재생 길이</strong>{question.metadata.artist} / {question.metadata.clipDurationsSec.join(" · ")}초</p>;
  if (question.gameType === "logo_quiz") return <p><strong>브랜드 분류 / 공개 단계</strong>{question.metadata.brandCategory} / {question.metadata.crops.length}단계</p>;
  if (question.gameType === "zoom_image") return <p><strong>확대 공개 단계</strong>{question.metadata.crops.length}단계</p>;
  if (question.gameType === "movie_poster") return <p><strong>개봉 / 국가 / 제목 마스크</strong>{question.metadata.releaseYear} / {question.metadata.country} / {question.metadata.titleMasks.length}개</p>;
  if (question.gameType === "song_drawing") return <><p><strong>아티스트 / 화풍</strong>{question.metadata.artist} / {question.metadata.visualStyle}</p>{question.metadata.lyricConcept && <p><strong>그림 콘셉트</strong>{question.metadata.lyricConcept}</p>}</>;
  return <p><strong>금지어</strong>{question.metadata.forbiddenWords.join(" · ")}</p>;
}

function questionPrompt(question: PlayableQuestion): string {
  if (question.gameType === "person_quiz") return question.metadata?.clue ?? "인물 이미지";
  if (question.gameType === "charades") return question.answer;
  if (question.gameType === "four_syllable") return `${question.metadata.prompt}··`;
  if (question.gameType === "three_in_time") return question.metadata.prompt;
  if (question.gameType === "progressive_hint") return question.metadata.hints[0];
  if (question.gameType === "football_career") return question.metadata.career.map((entry) => entry.club).join(" → ");
  if (question.gameType === "music_intro") return `${question.metadata.artist} 전주`;
  if (question.gameType === "logo_quiz") return `${question.metadata.brandCategory} 로고`;
  if (question.gameType === "zoom_image") return "확대 이미지";
  if (question.gameType === "movie_poster") return `${question.metadata.releaseYear}년 ${question.metadata.country} 영화`;
  if (question.gameType === "song_drawing") return question.metadata.lyricConcept ?? `${question.metadata.artist} 노래 그림`;
  return question.answer;
}

function questionAnswer(question: PlayableQuestion): string {
  if (question.gameType === "three_in_time") return "사회자 판정";
  if (question.gameType === "four_syllable") return question.metadata.fullAnswer;
  return question.answer ?? "-";
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
        {availableGameDefinitions.map((game, index) => {
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
        <ActionButton icon={<Database size={20} />} onClick={() => setScreen("data_admin")}>문제 데이터 관리</ActionButton>
        <ActionButton icon={<Trophy size={20} />} onClick={() => setScreen("scoreboard")}>점수판</ActionButton>
      </footer>
    </ScreenFrame>
  );
}

function GameIntroScreen() {
  const currentGameId = useSessionStore((state) => state.currentGameId);
  const setScreen = useSessionStore((state) => state.setScreen);

  if (!currentGameId) return null;
  const game = getPlayableGameDefinition(currentGameId);

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
  const [checkingMedia, setCheckingMedia] = useState(false);
  const [mediaFailures, setMediaFailures] = useState<MediaPreflightFailure[]>([]);
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
  const game = getPlayableGameDefinition(currentGameId);
  const settings = settingsByGame[currentGameId];
  const gameQuestions = questionsForGame(currentGameId);
  const categories = [...new Set(gameQuestions.map((question) => question.category))].sort();
  const queue = filterQuestions(gameQuestions, filter, usedQuestionIds);
  const requiredQuestions = game.engine === "speed" ? 1 : (settings.roundQuestionCount ?? (game.engine === "standard" ? 10 : 5));
  const insufficientQuestions = queue.length < requiredQuestions;
  const invalidSettings = !settingsAreValid(currentGameId, settings);
  const beginRound = async () => {
    setCheckingMedia(true);
    setMediaFailures([]);
    const result = await preflightQuestions(queue);
    setCheckingMedia(false);
    const playable = result.playable;
    if (playable.length < requiredQuestions) {
      setMediaFailures(result.failures);
      return;
    }
    startRound(
      playable.map((question) => question.id),
      Object.fromEntries(playable.map((question) => [question.id, getNewGameStageCount(question)])),
    );
  };

  return (
    <ScreenFrame title={game.label} subtitle={game.shortDescription}>
      <section className="setup-columns">
        <div className="settings-panel">
          <h2>라운드 설정</h2>
          {game.engine !== "progressive" && <>
            <label className="field-label">도전 팀</label>
            <div className="team-segments">
              {teams.map((team) => (
                <button key={team.id} className={currentTeamId === team.id ? "active" : ""}
                  style={{ "--team-color": team.color } as React.CSSProperties} onClick={() => selectTeam(team.id)}>
                  {team.name}
                </button>
              ))}
            </div>
          </>}
          <SettingsFields gameId={currentGameId} settings={settings} updateSettings={updateSettings} />
        </div>
        <div className="settings-panel">
          <h2>문제 필터</h2>
          <FilterFields filter={filter} categories={categories} updateFilter={updateFilter} />
          <div className="question-count">
            <strong>{queue.length}</strong>
            <span>개 문제 사용 가능</span>
          </div>
          {insufficientQuestions && (
            <p className="inline-error">라운드에 필요한 {requiredQuestions}문항보다 적습니다. 필터 또는 사용 기록을 조정하세요.</p>
          )}
          {invalidSettings && <p className="inline-error">고급 설정 값이 허용 범위를 벗어났습니다.</p>}
          {mediaFailures.length > 0 && (
            <div className="inline-error" role="alert">
              <strong>사용 가능한 미디어가 부족합니다.</strong>
              <span>{mediaFailures.map((failure) => failure.questionId).join(", ")}</span>
            </div>
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
          disabled={insufficientQuestions || invalidSettings || checkingMedia}
          onClick={() => void beginRound()}
        >
          {checkingMedia ? "미디어 확인 중" : "라운드 시작"}
        </ActionButton>
      </footer>
    </ScreenFrame>
  );
}

function settingsAreValid(gameId: GameType, settings: GameSettings): boolean {
  const game = getPlayableGameDefinition(gameId);
  if (game.engine === "speed") {
    if ((settings.roundDurationSec ?? 0) < 10 || (settings.roundDurationSec ?? 0) > 600) return false;
    if ((settings.scorePerCorrect ?? 0) < 1 || (settings.scorePerCorrect ?? 0) > 100) return false;
    if ((settings.previewDurationSec ?? 0) > 0 && ((settings.previewDurationSec ?? 0) < 1 || (settings.previewDurationSec ?? 0) > 10)) return false;
    return true;
  }
  if ((settings.roundQuestionCount ?? 0) < 1 || (settings.roundQuestionCount ?? 0) > 30) return false;
  if (game.engine === "standard") {
    const durationValid = gameId === "three_in_time"
      ? (settings.questionDurationSec ?? 0) >= 3 && (settings.questionDurationSec ?? 0) <= 15
      : (settings.questionDurationSec ?? 0) >= 3 && (settings.questionDurationSec ?? 0) <= 120;
    const countValid = gameId !== "three_in_time" || ((settings.requiredCount ?? 0) >= 2 && (settings.requiredCount ?? 0) <= 5);
    return durationValid && countValid
      && (settings.scoreOnSuccess ?? 0) >= 1 && (settings.scoreOnSuccess ?? 0) <= 100;
  }
  const scores = settings.stageScores;
  return (settings.stageDurationSec ?? 0) >= 3 && (settings.stageDurationSec ?? 0) <= 120
    && scores !== undefined && scores.length === settings.stageCount
    && scores.every((score) => score >= 0 && score <= 100);
}

function SettingsFields({
  gameId,
  settings,
  updateSettings,
}: {
  gameId: GameType;
  settings: GameSettings;
  updateSettings: (id: GameType, updates: Partial<GameSettings>) => void;
}) {
  const game = getPlayableGameDefinition(gameId);
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
      <div className="recommended-rules">
        <strong>권장 규칙 적용 중</strong>
        <span>{game.engine === "speed" ? `${settings.roundDurationSec}초 속도전` : `${settings.roundQuestionCount}문제`}</span>
      </div>
      {supportsDirectInput(gameId) ? <label className="select-field answer-mode-field"><span>정답 판정 방식</span><select value={settings.answerMode ?? "host"}
        onChange={(event) => updateSettings(gameId, { answerMode: event.target.value as GameSettings["answerMode"] })}>
        <option value="host">사회자가 판정</option>
        <option value="direct_input">참가자가 직접 입력</option>
      </select></label> : <p className="setting-note">이 게임은 여러 자유 답변을 판정해야 하므로 사회자 판정만 지원합니다.</p>}
      <details className="advanced-settings">
        <summary>고급 설정</summary>
        <div className="field-stack">
          {game.engine === "speed" && numericField("roundDurationSec", "라운드 시간 (초)", 10, 600)}
          {game.engine !== "speed" && numericField("roundQuestionCount", "라운드 문제 수", 1, 30)}
          {game.engine === "standard" && numericField("questionDurationSec", "문제 시간 (초)", 3, gameId === "three_in_time" ? 15 : 120)}
          {game.engine === "progressive" && numericField("stageDurationSec", gameId === "football_career" ? "문제 시간 (초)" : "단계별 시간 (초)", 3, 120)}
          {(gameId === "charades" || gameId === "taboo") && numericField("previewDurationSec", "설명자 확인 시간 (초)", 1, 10)}
          {game.engine === "speed" && numericField("scorePerCorrect", "정답 점수", 1, 100)}
          {game.engine === "standard" && numericField("scoreOnSuccess", "성공 점수", 1, 100)}
          {gameId === "three_in_time" && numericField("requiredCount", "필요 답변 수", 2, 5)}
          {game.engine === "progressive" && (settings.stageScores ?? []).map((score, index) => (
            <label className="number-field" key={index}><span>{gameId === "football_career" ? "정답 점수" : `${index + 1}단계 점수`}</span><input type="number" min="0" max="100" value={score}
              onChange={(event) => { const scores = [...(settings.stageScores ?? [])]; scores[index] = Number(event.target.value); updateSettings(gameId, { stageScores: scores }); }} /></label>
          ))}
          {game.engine === "progressive" && <label className="select-field"><span>오답 처리</span><select value={settings.wrongAnswerPolicy}
            onChange={(event) => updateSettings(gameId, { wrongAnswerPolicy: event.target.value as GameSettings["wrongAnswerPolicy"] })}>
            <option value="LOCK_CURRENT_STAGE">현재 단계에서 팀 잠금</option>
            <option value="END_QUESTION">즉시 문제 종료</option>
          </select></label>}
          {game.engine === "speed" && <label className="toggle-control"><input type="checkbox" checked={settings.allowPass ?? false}
            onChange={(event) => updateSettings(gameId, { allowPass: event.target.checked })} />패스 허용</label>}
        </div>
      </details>
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
      <label className="toggle-control"><input type="checkbox" checked={filter.includePrivateQuestions} onChange={(event) => updateFilter({ includePrivateQuestions: event.target.checked })} />로컬 전용 문제 포함</label>
    </div>
  );
}

function GamePlayScreen() {
  const state = useSessionStore();
  const dispatch = useSessionStore((store) => store.dispatch);
  const dispatchModuleAction = useSessionStore((store) => store.dispatchModuleAction);
  const currentQuestionId = state.questionQueue[state.questionIndex];
  const question = questions.find((item) => item.id === currentQuestionId);
  const game = state.currentGameId ? getPlayableGameDefinition(state.currentGameId) : null;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
      if (event.code === "Space") {
        event.preventDefault();
        const running = state.roundTimerStatus === "running" || state.phaseTimerStatus === "running";
        const paused = state.roundTimerStatus === "paused" || state.phaseTimerStatus === "paused";
        dispatch({ type: running ? "PAUSE" : paused ? "RESUME" : "START" });
      } else if (event.key.toLowerCase() === "p") dispatch({ type: "PASS" });
      else if (event.key.toLowerCase() === "n") dispatch({ type: "NEXT" });
      else if (event.key.toLowerCase() === "u") dispatch({ type: "UNDO" });
      else if (/^[1-4]$/.test(event.key)) {
        const team = state.teams[Number(event.key) - 1];
        if (team) dispatch({ type: game?.engine === "progressive" && state.phase === "active" ? "ATTEMPT" : "CORRECT", teamId: team.id });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, game?.engine, state.phase, state.phaseTimerStatus, state.roundTimerStatus, state.teams]);

  if (!game || !question) return null;
  const currentTeam = state.teams.find((team) => team.id === state.currentTeamId) ?? state.teams[0];
  const isPhaseClock = state.phase === "preview" || game.engine !== "speed";
  const timerStatus = isPhaseClock ? state.phaseTimerStatus : state.roundTimerStatus;
  const totalSeconds = Math.ceil((isPhaseClock ? state.phaseRemainingMs : state.roundRemainingMs) / 1000);
  const urgent = totalSeconds <= 10;
  const settings = state.settingsByGame[game.id];
  const attemptingTeam = state.teams.find((team) => team.id === state.attemptingTeamId);
  const currentStageCount = state.questionStageCounts[question.id] ?? settings.stageCount ?? settings.stageScores?.length ?? 1;
  const canPause = state.roundTimerStatus === "running" || state.phaseTimerStatus === "running";
  const canResume = state.roundTimerStatus === "paused" || state.phaseTimerStatus === "paused";

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
          <span>{state.phase === "preview" ? "제시어 확인" : timerStatus === "expired" ? "TIME" : "남은 시간"}</span>
          <strong>{formatTime(totalSeconds)}</strong>
        </div>
        <HostConsolePortal />
        <button className="icon-button" title="전체 화면" aria-label="전체 화면" onClick={() => document.documentElement.requestFullscreen?.()}><Expand size={22} /></button>
      </header>

      <section className="question-stage" style={{ "--accent": game.accent } as React.CSSProperties}>
        <div className="turn-indicator" style={{ color: currentTeam.color }}>{currentTeam.name} 도전</div>
        {state.phase === "ready" ? <div className="ready-cover"><Eye size={56} /><strong>문제가 아직 공개되지 않았습니다</strong><span>시작하면 문제와 타이머가 함께 표시됩니다.</span></div> :
          <QuestionContent question={question} stageIndex={state.stageIndex} phase={state.phase} requiredCount={settings.requiredCount ?? 3}
            runtime={state.moduleRuntime} dispatchModuleAction={dispatchModuleAction} />}
        {state.phase === "revealed" && question.answer && (
          <div className="answer-reveal"><span>정답</span><strong>{question.answer}</strong></div>
        )}
        {state.phase === "revealed" && <ContentCredits question={question} />}
      </section>

      {settings.answerMode === "direct_input" && state.phase === "active" && question.answer && <DirectAnswerPanel key={`${question.id}-${state.stageIndex}`} question={question} />}

      {state.phase === "attempt" && attemptingTeam && (
        <aside className="decision-bar" aria-label="도전 판정">
          <strong>{attemptingTeam.name}의 답을 판정하세요</strong>
          <ActionButton variant="success" onClick={() => dispatch({ type: "CORRECT", teamId: attemptingTeam.id })}>정답</ActionButton>
          <ActionButton variant="danger" onClick={() => dispatch({ type: "WRONG", teamId: attemptingTeam.id })}>오답 · 현재 단계 잠금</ActionButton>
        </aside>
      )}

      <footer className="host-controls">
        <div className="control-group">
          <button className="icon-button icon-button--large" title="실행 취소 (U)" aria-label="실행 취소" disabled={state.history.length === 0} onClick={() => dispatch({ type: "UNDO" })}><RotateCcw size={25} /></button>
          <button className="icon-button icon-button--large" title="라운드 종료" aria-label="라운드 종료" onClick={() => dispatch({ type: "END" })}><Flag size={25} /></button>
        </div>
        <div className="control-group control-group--center">
          {state.phase === "ready" && <ActionButton variant="primary" icon={<Play size={24} />} onClick={() => dispatch({ type: "START" })}>문제 공개 · 시작</ActionButton>}
          {canPause && <ActionButton icon={<Pause size={24} />} onClick={() => dispatch({ type: "PAUSE" })}>일시정지</ActionButton>}
          {canResume && state.phase !== "attempt" && <ActionButton variant="primary" icon={<Play size={24} />} onClick={() => dispatch({ type: "RESUME" })}>재개</ActionButton>}
          {state.phase === "active" && game.engine === "speed" && <>
            <button className="team-correct-button" style={{ backgroundColor: currentTeam.color }} onClick={() => dispatch({ type: "CORRECT", teamId: currentTeam.id })}><Check size={25} /><span>{currentTeam.name} 정답</span></button>
            {settings.allowPass && <ActionButton icon={<SkipForward size={23} />} onClick={() => dispatch({ type: "PASS" })}>패스</ActionButton>}
          </>}
          {(state.phase === "active" || state.phase === "attempt") && game.engine === "standard" && <>
            <button className="team-correct-button" style={{ backgroundColor: currentTeam.color }} onClick={() => dispatch({ type: "CORRECT", teamId: currentTeam.id })}><Check size={25} /><span>{currentTeam.name} 성공</span></button>
            <ActionButton variant="danger" icon={<X size={24} />} onClick={() => dispatch({ type: "WRONG", teamId: currentTeam.id })}>실패</ActionButton>
          </>}
          {state.phase === "active" && game.engine === "progressive" && <>
            {state.teams.map((team) => <button key={team.id} disabled={state.lockedTeamIds.includes(team.id)} className="team-correct-button"
              style={{ backgroundColor: team.color }} onClick={() => dispatch({ type: "ATTEMPT", teamId: team.id })}>
              <span>{state.lockedTeamIds.includes(team.id) ? `${team.name} 잠김` : `${team.name} 도전`}</span></button>)}
            {currentStageCount > 1 && <ActionButton icon={<SkipForward size={23} />} onClick={() => dispatch({ type: "NEXT_STAGE" })}>다음 단계</ActionButton>}
          </>}
          {state.phase !== "ready" && state.phase !== "revealed" && game.engine !== "speed" && <ActionButton icon={<Eye size={23} />} onClick={() => dispatch({ type: "REVEAL" })}>정답 공개</ActionButton>}
          {state.phase === "revealed" && (
            <ActionButton variant="primary" icon={<SkipForward size={23} />} onClick={() => dispatch({ type: "NEXT" })}>다음 문제</ActionButton>
          )}
        </div>
        <div className="question-progress">{state.questionIndex + 1} / {state.questionQueue.length}</div>
      </footer>
    </main>
  );
}

function QuestionContent({ question, stageIndex, phase, requiredCount, runtime, dispatchModuleAction }: {
  question: PlayableQuestion;
  stageIndex: number;
  phase: string;
  requiredCount: number;
  runtime: unknown;
  dispatchModuleAction: (action: unknown) => void;
}) {
  const revealed = phase === "revealed";
  if (question.gameType === "person_quiz") {
    return (
      <div className="person-question">
        <AssetImage key={question.id} src={question.asset} alt="맞힐 인물" fallback={question.metadata?.clue ?? "인물 이미지가 준비되지 않았습니다."} />
      </div>
    );
  }
  if (question.gameType === "charades") {
    if (phase === "active") return <div className="ready-cover"><Users size={56} /><strong>설명 중</strong><span>제시어는 숨겨졌습니다. 몸짓만 사용하세요.</span></div>;
    return <div className="word-question"><span>{revealed ? "정답" : "설명자만 확인하세요"}</span><strong>{question.answer}</strong></div>;
  }
  if (question.gameType === "four_syllable") {
    return <div className="word-question"><span>뒤의 두 글자는?</span><strong>{question.metadata.prompt}<i>··</i></strong>{revealed && <small>{question.metadata.fullAnswer}</small>}</div>;
  }
  if (question.gameType === "three_in_time") {
    return <div className="prompt-question"><span>{requiredCount}개 말하기</span><strong>{question.metadata.prompt}</strong>{revealed && <small>예시: {question.metadata.examples.join(", ")} · {question.metadata.judgingNotes}</small>}</div>;
  }
  if (question.gameType === "progressive_hint") {
    return <ol className="hint-list">{question.metadata.hints.slice(0, stageIndex + 1).map((hint, index) => <li key={hint}><span>힌트 {index + 1}</span><strong>{hint}</strong></li>)}</ol>;
  }
  if (question.gameType === "football_career") {
    return <div className="career-path">{question.metadata.career.map((entry, itemIndex) => <div key={`${entry.order}-${entry.club}`}><span>{itemIndex + 1}</span><strong>{entry.club}</strong></div>)}</div>;
  }
  return <NewGameQuestionContent question={question} stageIndex={stageIndex} revealed={revealed} runtime={runtime} dispatch={dispatchModuleAction} />;
}

function HostConsolePortal() {
  const popupRef = useRef<Window | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  const openConsole = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      return;
    }
    const popup = window.open("", "quiz-host-console", "popup,width=760,height=900");
    if (!popup) {
      setPopupBlocked(true);
      return;
    }
    popup.document.head.replaceChildren();
    popup.document.body.replaceChildren();
    popup.document.title = "사회자 콘솔 · 모두의 퀴즈룸";
    const viewport = popup.document.createElement("meta");
    viewport.name = "viewport";
    viewport.content = "width=device-width, initial-scale=1";
    popup.document.head.appendChild(viewport);
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      popup.document.head.appendChild(node.cloneNode(true));
    });
    const root = popup.document.createElement("div");
    root.id = "host-console-root";
    popup.document.body.appendChild(root);
    popupRef.current = popup;
    setPortalRoot(root);
    setPopupBlocked(false);
    popup.addEventListener("beforeunload", () => {
      popupRef.current = null;
      setPortalRoot(null);
    }, { once: true });
  };

  useEffect(() => () => popupRef.current?.close(), []);

  return <>
    <button className="icon-button" title="사회자 화면 열기" aria-label="사회자 화면 열기" onClick={openConsole}><MonitorUp size={22} /></button>
    {popupBlocked && <span className="popup-warning" role="alert">팝업을 허용해 주세요.</span>}
    {portalRoot && createPortal(<HostConsole />, portalRoot)}
  </>;
}

function DirectAnswerPanel({ question }: { question: PlayableQuestion }) {
  const state = useSessionStore();
  const dispatch = useSessionStore((store) => store.dispatch);
  const game = state.currentGameId ? getPlayableGameDefinition(state.currentGameId) : null;
  const [teamId, setTeamId] = useState(state.currentTeamId);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("");
  const availableTeams = state.teams.filter((team) => !state.lockedTeamIds.includes(team.id));

  if (!game) return null;
  const effectiveTeamId = availableTeams.some((team) => team.id === teamId) ? teamId : (availableTeams[0]?.id ?? "");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!guess.trim() || !effectiveTeamId) return;
    if (answerMatchesQuestion(question, guess)) {
      setFeedback("정답입니다.");
      dispatch({ type: "CORRECT", teamId: effectiveTeamId });
      return;
    }
    setGuess("");
    if (game.engine === "progressive") {
      dispatch({ type: "WRONG", teamId: effectiveTeamId });
      setFeedback("오답입니다. 이 문제 또는 현재 단계에서 잠겼습니다.");
    } else {
      setFeedback("오답입니다. 다시 입력하세요.");
    }
  };

  return <form className="direct-answer-panel" onSubmit={submit}>
    <div className="direct-answer-heading"><strong>정답 직접 입력</strong><span>입력한 답은 정답 공개 전까지 화면에만 잠시 표시됩니다.</span></div>
    {game.engine === "progressive" ? <label><span>도전 팀</span><select aria-label="도전 팀" value={effectiveTeamId} onChange={(event) => setTeamId(event.target.value)}>
      {state.teams.map((team) => <option key={team.id} value={team.id} disabled={state.lockedTeamIds.includes(team.id)}>{team.name}{state.lockedTeamIds.includes(team.id) ? " (잠김)" : ""}</option>)}
    </select></label> : <span className="direct-team-name">{state.teams.find((team) => team.id === state.currentTeamId)?.name} 답변</span>}
    <input aria-label="정답 입력" value={guess} onChange={(event) => { setGuess(event.target.value); setFeedback(""); }} autoComplete="off" autoFocus placeholder="정답을 입력하세요" />
    <ActionButton variant="primary" icon={<Check size={21} />} type="submit">제출</ActionButton>
    <span className={feedback.startsWith("정답입니다") ? "answer-feedback correct" : "answer-feedback"} aria-live="polite">{feedback}</span>
  </form>;
}

function supportsDirectInput(gameId: GameType): boolean {
  return gameId !== "three_in_time" && gameId !== "taboo";
}

function HostConsole() {
  const state = useSessionStore();
  const dispatch = useSessionStore((store) => store.dispatch);
  const game = state.currentGameId ? getPlayableGameDefinition(state.currentGameId) : null;
  const question = questions.find((item) => item.id === state.questionQueue[state.questionIndex]);
  if (!game || !question) return <main className="host-console-page"><p>진행 중인 문제가 없습니다.</p></main>;

  const settings = state.settingsByGame[game.id];
  const currentTeam = state.teams.find((team) => team.id === state.currentTeamId) ?? state.teams[0];
  const attemptingTeam = state.teams.find((team) => team.id === state.attemptingTeamId);
  const isPhaseClock = state.phase === "preview" || game.engine !== "speed";
  const timerStatus = isPhaseClock ? state.phaseTimerStatus : state.roundTimerStatus;
  const remainingMs = isPhaseClock ? state.phaseRemainingMs : state.roundRemainingMs;
  const canPause = state.roundTimerStatus === "running" || state.phaseTimerStatus === "running";
  const canResume = state.roundTimerStatus === "paused" || state.phaseTimerStatus === "paused";
  const currentStageCount = state.questionStageCounts[question.id] ?? settings.stageCount ?? settings.stageScores?.length ?? 1;

  return <main className="host-console-page">
    <header className="host-console-heading">
      <div><span>사회자 콘솔</span><h1>{game.label}</h1></div>
      <div className={remainingMs <= 10_000 ? "host-console-timer urgent" : "host-console-timer"}>
        <span>{timerStatus === "expired" ? "종료" : "남은 시간"}</span>
        <strong>{formatTime(Math.ceil(remainingMs / 1000))}</strong>
      </div>
    </header>
    <div className="host-console-status">
      <span>문제 {state.questionIndex + 1} / {state.questionQueue.length}</span>
      <span>상태: {phaseLabel(state.phase)}</span>
      {game.engine === "progressive" && currentStageCount > 1 && <span>단계 {state.stageIndex + 1} / {currentStageCount}</span>}
    </div>
    <HostAnswerGuide question={question} requiredCount={settings.requiredCount ?? 3} />
    {attemptingTeam && <section className="host-attempt"><strong>{attemptingTeam.name} 답변 판정</strong>
      <ActionButton variant="success" onClick={() => dispatch({ type: "CORRECT", teamId: attemptingTeam.id })}>정답</ActionButton>
      <ActionButton variant="danger" onClick={() => dispatch({ type: "WRONG", teamId: attemptingTeam.id })}>오답 · 잠금</ActionButton>
    </section>}
    <section className="host-console-actions" aria-label="사회자 조작">
      {state.phase === "ready" && <ActionButton variant="primary" icon={<Play size={20} />} onClick={() => dispatch({ type: "START" })}>문제 공개 · 시작</ActionButton>}
      {canPause && <ActionButton icon={<Pause size={20} />} onClick={() => dispatch({ type: "PAUSE" })}>일시정지</ActionButton>}
      {canResume && state.phase !== "attempt" && <ActionButton variant="primary" icon={<Play size={20} />} onClick={() => dispatch({ type: "RESUME" })}>재개</ActionButton>}
      {state.phase === "active" && game.engine === "speed" && <>
        <ActionButton variant="success" onClick={() => dispatch({ type: "CORRECT", teamId: currentTeam.id })}>{currentTeam.name} 정답</ActionButton>
        {settings.allowPass && <ActionButton onClick={() => dispatch({ type: "PASS" })}>패스</ActionButton>}
      </>}
      {(state.phase === "active" || state.phase === "attempt") && game.engine === "standard" && <>
        <ActionButton variant="success" onClick={() => dispatch({ type: "CORRECT", teamId: currentTeam.id })}>{currentTeam.name} 성공</ActionButton>
        <ActionButton variant="danger" onClick={() => dispatch({ type: "WRONG", teamId: currentTeam.id })}>실패</ActionButton>
      </>}
      {state.phase === "active" && game.engine === "progressive" && state.teams.map((team) => <ActionButton key={team.id} disabled={state.lockedTeamIds.includes(team.id)} onClick={() => dispatch({ type: "ATTEMPT", teamId: team.id })}>{state.lockedTeamIds.includes(team.id) ? `${team.name} 잠김` : `${team.name} 도전`}</ActionButton>)}
      {state.phase === "active" && game.engine === "progressive" && currentStageCount > 1 && <ActionButton onClick={() => dispatch({ type: "NEXT_STAGE" })}>다음 단계</ActionButton>}
      {state.phase !== "ready" && state.phase !== "revealed" && game.engine !== "speed" && <ActionButton icon={<Eye size={20} />} onClick={() => dispatch({ type: "REVEAL" })}>정답 공개</ActionButton>}
      {state.phase === "revealed" && <ActionButton variant="primary" onClick={() => dispatch({ type: "NEXT" })}>다음 문제</ActionButton>}
      <ActionButton icon={<RotateCcw size={20} />} disabled={state.history.length === 0} onClick={() => dispatch({ type: "UNDO" })}>실행 취소</ActionButton>
      <ActionButton icon={<Flag size={20} />} onClick={() => dispatch({ type: "END" })}>라운드 종료</ActionButton>
    </section>
  </main>;
}

function HostAnswerGuide({ question, requiredCount }: { question: PlayableQuestion; requiredCount: number }) {
  const aliases = question.acceptedAnswers?.filter((answer) => answer !== question.answer) ?? [];
  return <section className="host-answer-guide">
    <span className="host-only-label">참가자 화면에 표시되지 않는 정보</span>
    {question.gameType === "three_in_time" ? <>
      <p className="host-prompt">{question.metadata.prompt}</p>
      <h2>유효 답 {requiredCount}개 필요</h2>
      <div><strong>판정 예시</strong><ul>{question.metadata.examples.map((example) => <li key={example}>{example}</li>)}</ul></div>
      <p className="judging-note"><strong>판정 기준</strong> {question.metadata.judgingNotes}</p>
    </> : <>
      <span>정답</span><h2>{question.answer}</h2>
      {aliases.length > 0 && <p><strong>허용 답안</strong> {aliases.join(" · ")}</p>}
      {question.gameType === "four_syllable" && <p><strong>완성어</strong> {question.metadata.fullAnswer}</p>}
      {question.gameType === "progressive_hint" && <div><strong>전체 힌트</strong><ol>{question.metadata.hints.map((hint) => <li key={hint}>{hint}</li>)}</ol></div>}
      {question.gameType === "football_career" && <div><strong>전체 경력</strong><ol>{question.metadata.career.map((entry) => <li key={`${entry.order}-${entry.club}`}>{entry.club}</li>)}</ol></div>}
      {question.gameType === "music_intro" && <p><strong>아티스트</strong> {question.metadata.artist}</p>}
      {question.gameType === "movie_poster" && <p><strong>영화 정보</strong> {question.metadata.releaseYear} · {question.metadata.country}</p>}
      {question.gameType === "song_drawing" && <p><strong>아티스트</strong> {question.metadata.artist}</p>}
      {question.gameType === "taboo" && <div><strong>금지어</strong><ul>{question.metadata.forbiddenWords.map((word) => <li key={word}>{word}</li>)}</ul></div>}
    </>}
  </section>;
}

function phaseLabel(phase: string): string {
  return ({ ready: "준비", preview: "설명자 확인", active: "진행", attempt: "판정", revealed: "정답 공개" } as Record<string, string>)[phase] ?? phase;
}

function ContentCredits({ question }: { question: PlayableQuestion }) {
  if (!isMvpQuestion(question)) {
    const metadata = question.metadata as { license?: string; credit?: string };
    if (!question.source && !metadata.license && !metadata.credit) return null;
    return <details className="content-credits"><summary>콘텐츠 출처·라이선스</summary>
      {(metadata.license || metadata.credit) && <p>미디어: {metadata.license ?? "미기재"} · {metadata.credit ?? "크레딧 미기재"}</p>}
      {question.source && <p><a href={question.source} target="_blank" rel="noreferrer">문항 출처</a></p>}
    </details>;
  }
  if (!question.attribution && !question.sources?.length && !question.source) return null;
  return <details className="content-credits"><summary>콘텐츠 출처·라이선스</summary>
    {question.attribution && <p>사진: {question.attribution.author} · <a href={question.attribution.sourceUrl} target="_blank" rel="noreferrer">원본</a> · {question.attribution.licenseUrl ? <a href={question.attribution.licenseUrl} target="_blank" rel="noreferrer">{question.attribution.license}</a> : <span>{question.attribution.license}</span>} · {question.attribution.modified}</p>}
    {question.sources?.map((source) => <p key={source.url}>{source.publisher}: <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> ({source.accessedAt})</p>)}
    {!question.sources?.length && question.source && <p><a href={question.source} target="_blank" rel="noreferrer">문항 출처</a></p>}
  </details>;
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
    <ScreenFrame title="라운드 결과" subtitle={currentGameId ? getPlayableGameDefinition(currentGameId).label : ""}>
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
