import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { answerMatchesQuestion } from "./domain/answerMatching";
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

  it("게임 선택 화면에서 데이터 관리 페이지로 이동한다", async () => {
    const user = userEvent.setup();
    useSessionStore.setState({ screen: "game_select" });
    render(<App />);
    await user.click(screen.getByRole("button", { name: "문제 데이터 관리" }));
    expect(screen.getByRole("heading", { name: "문제 데이터 관리" })).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: "문제 데이터 관리" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "데이터 현황" })).getAllByText("684")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "몸으로 말해요 100문항" }));
    await user.type(screen.getByLabelText("문항 검색"), "볼링");
    expect(screen.getByRole("region", { name: "몸으로 말해요 문제 목록" })).toHaveTextContent("볼링");
  });
});
