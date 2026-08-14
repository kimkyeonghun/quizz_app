import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { useSessionStore } from "./store/sessionStore";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    useSessionStore.setState({ screen: "home", teams: [
      { id: "team-1", name: "A팀", color: "#e14d3a", score: 0 },
      { id: "team-2", name: "B팀", color: "#3973c6", score: 0 },
    ] });
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
