import { beforeEach, describe, expect, it } from "vitest";
import { useSessionStore } from "./sessionStore";

describe("sessionStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useSessionStore.getState().newSession();
  });

  it("속도 게임 정답의 점수와 문제 이동을 Undo로 함께 복원한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("charades");
    store.startRound(["charades_1", "charades_2"]);
    store.dispatch({ type: "CORRECT", teamId: "team-1" });

    expect(useSessionStore.getState().teams[0].score).toBe(1);
    expect(useSessionStore.getState().questionIndex).toBe(1);

    useSessionStore.getState().dispatch({ type: "UNDO" });
    expect(useSessionStore.getState().teams[0].score).toBe(0);
    expect(useSessionStore.getState().questionIndex).toBe(0);
  });

  it("진행형 게임의 현재 단계 배점을 적용한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("progressive_hint");
    store.startRound(["hint_1"]);
    store.dispatch({ type: "NEXT_STAGE" });
    useSessionStore.getState().dispatch({ type: "CORRECT", teamId: "team-1" });
    expect(useSessionStore.getState().teams[0].score).toBe(2);
  });

  it("속도 게임 타이머가 만료되면 라운드 결과로 이동한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("charades");
    store.startRound(["charades_1"]);
    store.dispatch({ type: "START" });
    const deadline = useSessionStore.getState().deadline!;
    useSessionStore.getState().tick(deadline + 1);
    expect(useSessionStore.getState().timerStatus).toBe("expired");
    expect(useSessionStore.getState().screen).toBe("round_result");
  });
});
