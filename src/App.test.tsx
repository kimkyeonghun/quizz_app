import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { answerMatchesQuestion } from "./domain/answerMatching";
import { questions } from "./data/questions";
import { useSessionStore } from "./store/sessionStore";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    useSessionStore.getState().newSession();
    useSessionStore.setState({ screen: "home", teams: [
      { id: "team-1", name: "A팀", color: "#e14d3a", score: 0 },
      { id: "team-2", name: "B팀", color: "#3973c6", score: 0 },
    ] });
  });

  it("통합된 신규 게임 4개를 표시하고 기존 이미지 확대와 설명 금지어는 숨긴다", () => {
    useSessionStore.setState({ screen: "game_select" });
    render(<App />);
    expect(screen.getByRole("heading", { name: "로고 확대 퀴즈" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "영화 포스터" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "이미지 확대" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "음악 전주" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "노래 그림" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "설명 금지어" })).not.toBeInTheDocument();
  });

  it("신규 게임의 안내와 샘플 문제 화면을 렌더링한다", () => {
    useSessionStore.setState({ currentGameId: "logo_quiz", screen: "game_intro" });
    const { rerender } = render(<App />);
    expect(screen.getByRole("heading", { name: "로고 확대 퀴즈" })).toBeInTheDocument();
    expect(screen.getByText(/로고의 좁은 영역부터/)).toBeInTheDocument();

    useSessionStore.setState({
      screen: "game_play",
      questionQueue: ["fixture-logo-1"],
      questionIndex: 0,
      questionStageCounts: { "fixture-logo-1": 3 },
      currentTeamId: "team-1",
      phase: "active",
      phaseTimerStatus: "idle",
      phaseRemainingMs: 20_000,
      moduleRuntime: {},
    });
    rerender(<App />);
    expect(screen.getByRole("img", { name: "테스트 로고 1단계" })).toBeInTheDocument();
    expect(screen.queryByText("픽스처 로고")).not.toBeInTheDocument();
  });

  it("새 게임에서 팀 설정 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("heading", { name: "모두의 퀴즈룸" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "새 게임 시작" }));
    expect(screen.getByRole("heading", { name: "팀 설정" })).toBeInTheDocument();
  });

  it("선택한 게임의 진행 방식과 채점 안내를 표시한다", () => {
    useSessionStore.setState({ currentGameId: "charades", screen: "game_intro" });
    render(<App />);
    expect(screen.getByRole("heading", { name: "몸으로 말해요" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "진행 순서" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "채점 방식" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "게임 설정" })).toBeInTheDocument();
  });

  it("게임 선택 화면에서 데이터 관리 페이지로 이동한다", async () => {
    const user = userEvent.setup();
    useSessionStore.setState({ screen: "game_select" });
    render(<App />);
    await user.click(screen.getByRole("button", { name: "문제 데이터 관리" }));
    expect(await screen.findByRole("heading", { name: "문제 데이터 관리" })).toBeInTheDocument();
  });

  it("직접 입력 답안을 공백과 기호 차이 없이 판정하고 네 글자 완성어도 인정한다", () => {
    expect(answerMatchesQuestion({
      id: "person_test", gameType: "person_quiz", answer: "손흥민", acceptedAnswers: ["Son Heung-min"],
      category: "sports", difficulty: 1, enabled: true, verified: true,
    }, "son heung min")).toBe(true);
    expect(answerMatchesQuestion({
      id: "four_test", gameType: "four_syllable", answer: "이조", acceptedAnswers: ["이조"],
      category: "idiom", difficulty: 1, enabled: true, verified: true,
      metadata: { prompt: "일석", fullAnswer: "일석이조" },
    }, "일석이조")).toBe(true);
  });

  it("홈에서 데이터 관리 페이지를 열고 게임별 문항을 검색한다", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "문제 데이터 관리" }));
    expect(await screen.findByRole("heading", { name: "문제 데이터 관리" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "데이터 현황" })).getAllByText(String(questions.length))).toHaveLength(2);
    const charadesCount = questions.filter((question) => question.gameType === "charades").length;
    await user.click(screen.getByRole("button", { name: `몸으로 말해요 ${charadesCount}문항` }));
    await user.type(screen.getByLabelText("문항 검색"), "박수치기");
    expect(screen.getByRole("region", { name: "몸으로 말해요 문제 목록" })).toHaveTextContent("박수치기");
  });
});
