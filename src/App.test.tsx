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
});
