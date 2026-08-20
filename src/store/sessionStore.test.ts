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

  it("문제 데이터의 단계 수를 사용해 마지막 힌트에서 종료한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("zoom_image");
    store.startRound(["zoom-test"], { "zoom-test": 2 });
    store.dispatch({ type: "NEXT_STAGE" });
    expect(useSessionStore.getState().stageIndex).toBe(1);
    useSessionStore.getState().dispatch({ type: "NEXT_STAGE" });
    expect(useSessionStore.getState().stageIndex).toBe(1);
    expect(useSessionStore.getState().revealed).toBe(true);
  });

  it("설명 금지어 공개 상태를 Undo로 복원한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("taboo");
    store.startRound(["taboo-test"]);
    store.dispatchModuleAction({ type: "HIDE_FORBIDDEN" });
    expect(useSessionStore.getState().moduleRuntime).toEqual({ forbiddenWordsVisible: false });
    useSessionStore.getState().dispatch({ type: "UNDO" });
    expect(useSessionStore.getState().moduleRuntime).toEqual({ forbiddenWordsVisible: true });
  });
});
