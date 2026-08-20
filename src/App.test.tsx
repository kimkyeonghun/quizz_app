import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
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

  it("활성화된 신규 게임 5개를 표시하고 설명 금지어는 숨긴다", () => {
    useSessionStore.setState({ screen: "game_select" });
    render(<App />);
    expect(screen.getByRole("heading", { name: "로고 퀴즈" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "영화 포스터" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "이미지 확대" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "음악 전주" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "노래 그림" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "설명 금지어" })).not.toBeInTheDocument();
  });

  it("신규 게임의 안내와 샘플 문제 화면을 렌더링한다", () => {
    useSessionStore.setState({ currentGameId: "logo_quiz", screen: "game_intro" });
    const { rerender } = render(<App />);
    expect(screen.getByRole("heading", { name: "로고 퀴즈" })).toBeInTheDocument();
    expect(screen.getByText(/로고가 어떤 브랜드인지/)).toBeInTheDocument();

    useSessionStore.setState({
      screen: "game_play",
      questionQueue: ["logo-001"],
      questionIndex: 0,
      questionStageCounts: { "logo-001": 1 },
      currentTeamId: "team-1",
      timerStatus: "idle",
      remainingMs: 20_000,
      revealed: false,
      moduleRuntime: {},
    });
    rerender(<App />);
    expect(screen.getByRole("img", { name: "기술 로고" })).toBeInTheDocument();
    expect(screen.queryByText("노바")).not.toBeInTheDocument();
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
});
