import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { getPlayableGameDefinition, playableGameRegistry } from "../adapters/newGames";
import { ContentReviewPreview } from "../components/ContentReviewPreview";
import { questionBundle, questionLoadErrors, questionLoadIssues, questions, questionsForGame } from "../data/questions";
import { MVP_GAME_TYPES, type GameType, type MvpQuestion, type PlayableQuestion } from "../domain/types";
import { useSessionStore } from "../store/sessionStore";

function isMvpQuestion(question: PlayableQuestion): question is MvpQuestion {
  return (MVP_GAME_TYPES as readonly string[]).includes(question.gameType);
}

export default function DataAdminScreen() {
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
      <button className="button button--secondary" onClick={() => setScreen("home")}><ArrowLeft size={20} /><span>홈으로</span></button>
    </header>

    <section className="admin-overview" aria-label="데이터 현황">
      <div><span>전체 문항</span><strong>{questions.length}</strong></div>
      <div><span>활성·검수</span><strong>{questions.filter((question) => question.enabled && question.verified).length}</strong></div>
      <div><span>로컬 전용</span><strong>{totalPrivate}</strong></div>
      <div className={questionLoadErrors.length ? "has-errors" : ""}><span>로드 오류</span><strong>{questionLoadErrors.length}</strong></div>
    </section>

    <p className="admin-profile">콘텐츠 프로필: <strong>{questionBundle.profile}</strong></p>
    {questionLoadIssues.length > 0 && <section className="content-issue-list" aria-label="콘텐츠 로드 오류">
      <h2>콘텐츠 로드 오류</h2>
      {questionLoadIssues.map((issue, index) => <article key={`${issue.file}-${issue.index}-${issue.path}-${index}`}>
        <strong>{issue.code}</strong><span>{issue.file}{issue.index === undefined ? "" : `[${issue.index}]`}</span>
        {issue.questionId && <span>ID: {issue.questionId}</span>}{issue.path && <code>{issue.path}</code>}<p>{issue.message}</p>
      </article>)}
    </section>}

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
        <option value="all">전체</option>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
      <label><span>분류</span><select aria-label="관리 분류" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
        <option value="all">전체</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label><span>이용 범위</span><select aria-label="관리 이용 범위" value={scope} onChange={(event) => { setScope(event.target.value); setPage(1); }}>
        <option value="all">전체</option><option value="redistributable">재배포 가능</option><option value="private">로컬 전용</option></select></label>
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
  return <details className="admin-question-row"><summary>
    <span className="admin-row-number">{number}</span>
    {question.asset ? <img src={`${import.meta.env.BASE_URL}${question.asset.replace(/^\//, "")}`} alt="" /> : <span className="admin-no-asset">TEXT</span>}
    <span className="admin-row-main"><small>{question.id}</small><strong>{questionPrompt(question)}</strong></span>
    <span className="admin-row-answer"><small>정답</small><strong>{questionAnswer(question)}</strong></span>
    <span className="admin-row-meta"><em>난이도 {question.difficulty}</em><em>{question.category}</em>
      {isMvpQuestion(question) && question.usageScope === "private_only" && <em className="private">로컬 전용</em>}</span>
  </summary><div className="admin-question-detail">
    <section><h3>문항 데이터</h3><QuestionMetadata question={question} />
      {question.acceptedAnswers?.length ? <p><strong>허용 답안</strong>{question.acceptedAnswers.join(" · ")}</p> : null}
      {question.tags?.length ? <p><strong>태그</strong>{question.tags.join(" · ")}</p> : null}</section>
    <section><h3>출처·권한</h3>
      {isMvpQuestion(question) && question.attribution && <p><strong>이미지</strong><a href={question.attribution.sourceUrl} target="_blank" rel="noreferrer">원본 페이지</a> · {question.attribution.license} · {question.attribution.accessedAt}</p>}
      {isMvpQuestion(question) && question.sources?.map((source) => <p key={source.url}><strong>{source.publisher}</strong><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> · {source.accessedAt}</p>)}
      {!isMvpQuestion(question) && "license" in question.metadata && <p><strong>미디어</strong>{String(question.metadata.license)} · {String(question.metadata.credit)}</p>}
      {question.source && <p>{/^https?:/.test(question.source) ? <a href={question.source} target="_blank" rel="noreferrer">문항 출처</a> : question.source}</p>}
      {!question.source && (!isMvpQuestion(question) || (!question.attribution && !question.sources?.length)) && <p className="admin-muted">등록된 외부 출처가 없는 자체 작성 문항입니다.</p>}
    </section>
    <ContentReviewPreview question={question} />
  </div></details>;
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
