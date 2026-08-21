import { beforeEach, describe, expect, it } from "vitest";
import { useSessionStore } from "./sessionStore";

describe("sessionStore 고도화 규칙", () => {
  beforeEach(() => {
    localStorage.clear();
    useSessionStore.getState().newSession();
  });

  it("시작 전에는 판정할 수 없고 몸으로 말해요 미리보기 동안 라운드 시계를 멈춘다", () => {
    const store = useSessionStore.getState();
    store.selectGame("charades");
    store.startRound(["charades_1", "charades_2"]);
    store.dispatch({ type: "CORRECT", teamId: "team-1" });
    expect(useSessionStore.getState().teams[0].score).toBe(0);

    store.dispatch({ type: "START" });
    expect(useSessionStore.getState().phase).toBe("preview");
    expect(useSessionStore.getState().roundTimerStatus).toBe("idle");
    const previewDeadline = useSessionStore.getState().phaseDeadline!;
    useSessionStore.getState().tick(previewDeadline + 1);
    expect(useSessionStore.getState().phase).toBe("active");
    expect(useSessionStore.getState().roundTimerStatus).toBe("running");
  });

  it("속도 게임 정답의 점수와 문제 이동을 Undo로 함께 복원한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("person_quiz");
    store.startRound(["person_1", "person_2"]);
    store.dispatch({ type: "START" });
    useSessionStore.getState().dispatch({ type: "CORRECT", teamId: "team-1" });
    expect(useSessionStore.getState().teams[0].score).toBe(1);
    expect(useSessionStore.getState().questionIndex).toBe(1);

    useSessionStore.getState().dispatch({ type: "UNDO" });
    expect(useSessionStore.getState().teams[0].score).toBe(0);
    expect(useSessionStore.getState().questionIndex).toBe(0);
  });

  it("일반형은 설정된 라운드 문제 수만 큐에 담는다", () => {
    const store = useSessionStore.getState();
    store.selectGame("three_in_time");
    store.startRound(Array.from({ length: 20 }, (_, index) => `three_${index}`));
    expect(useSessionStore.getState().questionQueue).toHaveLength(10);
  });

  it("진행형 게임의 현재 단계 배점을 적용한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("progressive_hint");
    store.startRound(["hint_1", "hint_2", "hint_3", "hint_4", "hint_5"]);
    store.dispatch({ type: "START" });
    useSessionStore.getState().dispatch({ type: "NEXT_STAGE" });
    useSessionStore.getState().dispatch({ type: "ATTEMPT", teamId: "team-1" });
    useSessionStore.getState().dispatch({ type: "CORRECT", teamId: "team-1" });
    expect(useSessionStore.getState().teams[0].score).toBe(2);
  });

  it("진행형 오답 팀을 현재 단계에서만 잠그고 다음 단계에 해제한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("progressive_hint");
    store.startRound(["hint_1", "hint_2", "hint_3", "hint_4", "hint_5"]);
    store.dispatch({ type: "START" });
    useSessionStore.getState().dispatch({ type: "ATTEMPT", teamId: "team-1" });
    useSessionStore.getState().dispatch({ type: "WRONG", teamId: "team-1" });
    expect(useSessionStore.getState().lockedTeamIds).toEqual(["team-1"]);
    expect(useSessionStore.getState().phase).toBe("active");
    useSessionStore.getState().dispatch({ type: "NEXT_STAGE" });
    expect(useSessionStore.getState().lockedTeamIds).toEqual([]);
  });

  it("속도 게임 라운드 타이머가 만료되면 결과로 이동한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("person_quiz");
    store.startRound(["person_1"]);
    store.dispatch({ type: "START" });
    const deadline = useSessionStore.getState().roundDeadline!;
    useSessionStore.getState().tick(deadline + 1);
    expect(useSessionStore.getState().roundTimerStatus).toBe("expired");
    expect(useSessionStore.getState().screen).toBe("round_result");
  });

  it("진행형 타이머 만료 시 다음 단계로 자동 이동하고 마지막에는 공개한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("progressive_hint");
    store.startRound(["hint_1", "hint_2", "hint_3", "hint_4", "hint_5"]);
    store.dispatch({ type: "START" });
    let deadline = useSessionStore.getState().phaseDeadline!;
    useSessionStore.getState().tick(deadline + 1);
    expect(useSessionStore.getState().stageIndex).toBe(1);
    deadline = useSessionStore.getState().phaseDeadline!;
    useSessionStore.getState().tick(deadline + 1);
    deadline = useSessionStore.getState().phaseDeadline!;
    useSessionStore.getState().tick(deadline + 1);
    expect(useSessionStore.getState().phase).toBe("revealed");
  });

  it("선수 커리어는 20초 단일 단계에서 1점을 주고 시간 만료 시 바로 공개한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("football_career");
    store.startRound(["career_1", "career_2", "career_3", "career_4", "career_5"]);
    store.dispatch({ type: "START" });
    useSessionStore.getState().dispatch({ type: "ATTEMPT", teamId: "team-1" });
    useSessionStore.getState().dispatch({ type: "CORRECT", teamId: "team-1" });
    expect(useSessionStore.getState().teams[0].score).toBe(1);

    useSessionStore.getState().dispatch({ type: "NEXT" });
    useSessionStore.getState().dispatch({ type: "START" });
    const deadline = useSessionStore.getState().phaseDeadline!;
    useSessionStore.getState().tick(deadline + 1);
    expect(useSessionStore.getState().stageIndex).toBe(0);
    expect(useSessionStore.getState().phase).toBe("revealed");
  });

  it("로고 확대는 문제별 3단계를 현재 타이머와 Undo 구조로 진행한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("logo_quiz");
    store.startRound(["logo-1", "logo-2", "logo-3", "logo-4", "logo-5"], { "logo-1": 3 });
    store.dispatch({ type: "START" });
    useSessionStore.getState().dispatch({ type: "NEXT_STAGE" });
    expect(useSessionStore.getState().stageIndex).toBe(1);
    useSessionStore.getState().dispatch({ type: "ATTEMPT", teamId: "team-1" });
    useSessionStore.getState().dispatch({ type: "CORRECT", teamId: "team-1" });
    expect(useSessionStore.getState().teams[0].score).toBe(2);
    useSessionStore.getState().dispatch({ type: "UNDO" });
    expect(useSessionStore.getState().teams[0].score).toBe(0);
    expect(useSessionStore.getState().phase).toBe("attempt");
  });

  it("설명 금지어 모듈 상태도 Undo로 복원한다", () => {
    const store = useSessionStore.getState();
    store.selectGame("taboo");
    store.startRound(["taboo-1"]);
    store.dispatchModuleAction({ type: "HIDE_FORBIDDEN" });
    expect(useSessionStore.getState().moduleRuntime).toEqual({ forbiddenWordsVisible: false });
    useSessionStore.getState().dispatch({ type: "UNDO" });
    expect(useSessionStore.getState().moduleRuntime).toEqual({ forbiddenWordsVisible: true });
  });

  it("기존 영속 상태의 점수와 사용 기록을 보존하며 새 판정 모드 기본값을 마이그레이션한다", async () => {
    const migrate = useSessionStore.persist.getOptions().migrate!;
    const migrated = await migrate({
      teams: [{ id: "team-1", name: "기존 팀", color: "#123456", score: 7 }],
      currentTeamId: "team-1",
      usedQuestionIds: ["career_000001"],
      settingsByGame: {
        football_career: { stageDurationSec: 30, stageCount: 4, stageScores: [4, 3, 2, 1], wrongAnswerPolicy: "LOCK_CURRENT_STAGE" },
      },
    }, 3) as Partial<ReturnType<typeof useSessionStore.getState>>;

    expect(migrated.teams?.[0].score).toBe(7);
    expect(migrated.usedQuestionIds).toEqual(["career_000001"]);
    expect(migrated.settingsByGame?.football_career).toMatchObject({ stageDurationSec: 30, stageCount: 1, stageScores: [1] });
    expect(migrated.settingsByGame?.person_quiz.answerMode).toBe("host");
    expect(migrated.filter?.includePrivateQuestions).toBe(true);
  });

  it("v5 플레이 화면을 설정 화면으로 복구하고 손상된 저장 값은 안전한 기본값으로 대체한다", async () => {
    const migrate = useSessionStore.persist.getOptions().migrate!;
    const restored = await migrate({ screen: "game_play", currentGameId: "logo_quiz", selectedGameIds: ["logo_quiz", "zoom_image"] }, 5) as Partial<ReturnType<typeof useSessionStore.getState>>;
    expect(restored.screen).toBe("game_setup");
    expect(restored.currentGameId).toBe("logo_quiz");
    expect(restored.selectedGameIds).toEqual(["logo_quiz"]);

    const corrupted = await migrate({ teams: "broken", selectedGameIds: "broken", usedQuestionIds: ["ok", 7], roundNumber: -2 }, 5) as Partial<ReturnType<typeof useSessionStore.getState>>;
    expect(corrupted.screen).toBe("home");
    expect(corrupted.teams).toHaveLength(2);
    expect(corrupted.usedQuestionIds).toEqual(["ok"]);
    expect(corrupted.roundNumber).toBe(1);
  });
});
