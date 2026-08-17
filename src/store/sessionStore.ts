import { create } from "zustand";
import { persist } from "zustand/middleware";
import { gameRegistry } from "../config/gameRegistry";
import type { AppScreen, FilterSettings, GameSettings, GameplayPhase, HostAction, MvpGameType, Team, TimerStatus } from "../domain/types";

const TEAM_COLORS = ["#e14d3a", "#3973c6", "#1e8f65", "#e29b23"];

function createTeams(count = 2): Team[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `team-${index + 1}`,
    name: `${String.fromCharCode(65 + index)}팀`,
    color: TEAM_COLORS[index],
    score: 0,
  }));
}

const defaultFilter: FilterSettings = {
  difficultyMin: 1,
  difficultyMax: 5,
  category: "",
  tags: [],
  verifiedOnly: true,
  excludeUsedQuestions: true,
  includePrivateQuestions: true,
  questionOrder: "random",
};

function defaultSettings(): Record<MvpGameType, GameSettings> {
  return Object.fromEntries(Object.entries(gameRegistry).map(([id, game]) => [id, { ...game.defaultSettings }])) as Record<MvpGameType, GameSettings>;
}

function phaseDurationMs(settings: GameSettings): number {
  return (settings.stageDurationSec ?? settings.questionDurationSec ?? 5) * 1000;
}

function initialRoundScores(teams: Team[]): Record<string, number> {
  return Object.fromEntries(teams.map((team) => [team.id, 0]));
}

interface SessionSnapshot {
  teams: Team[];
  currentTeamId: string;
  questionIndex: number;
  stageIndex: number;
  phase: GameplayPhase;
  attemptingTeamId: string | null;
  lockedTeamIds: string[];
  usedQuestionIds: string[];
  roundTimerStatus: TimerStatus;
  roundRemainingMs: number;
  roundDeadline: number | null;
  phaseTimerStatus: TimerStatus;
  phaseRemainingMs: number;
  phaseDeadline: number | null;
  roundScores: Record<string, number>;
  screen: AppScreen;
}

export interface SessionStore {
  sessionId: string;
  screen: AppScreen;
  teams: Team[];
  selectedGameIds: MvpGameType[];
  currentGameId: MvpGameType | null;
  currentTeamId: string;
  settingsByGame: Record<MvpGameType, GameSettings>;
  filter: FilterSettings;
  questionQueue: string[];
  questionIndex: number;
  stageIndex: number;
  roundNumber: number;
  usedQuestionIds: string[];
  phase: GameplayPhase;
  attemptingTeamId: string | null;
  lockedTeamIds: string[];
  roundTimerStatus: TimerStatus;
  roundRemainingMs: number;
  roundDeadline: number | null;
  phaseTimerStatus: TimerStatus;
  phaseRemainingMs: number;
  phaseDeadline: number | null;
  roundScores: Record<string, number>;
  history: SessionSnapshot[];
  setScreen: (screen: AppScreen) => void;
  setTeamCount: (count: number) => void;
  updateTeam: (teamId: string, updates: Pick<Team, "name" | "color">) => void;
  toggleGame: (gameId: MvpGameType) => void;
  selectGame: (gameId: MvpGameType) => void;
  selectTeam: (teamId: string) => void;
  updateSettings: (gameId: MvpGameType, updates: Partial<GameSettings>) => void;
  updateFilter: (updates: Partial<FilterSettings>) => void;
  startRound: (questionIds: string[]) => void;
  dispatch: (action: HostAction) => void;
  tick: (now: number) => void;
  clearUsedQuestions: () => void;
  newSession: () => void;
}

function takeSnapshot(state: SessionStore): SessionSnapshot {
  return {
    teams: state.teams.map((team) => ({ ...team })), currentTeamId: state.currentTeamId,
    questionIndex: state.questionIndex, stageIndex: state.stageIndex, phase: state.phase,
    attemptingTeamId: state.attemptingTeamId, lockedTeamIds: [...state.lockedTeamIds],
    usedQuestionIds: [...state.usedQuestionIds], roundTimerStatus: state.roundTimerStatus,
    roundRemainingMs: state.roundRemainingMs, roundDeadline: state.roundDeadline,
    phaseTimerStatus: state.phaseTimerStatus, phaseRemainingMs: state.phaseRemainingMs,
    phaseDeadline: state.phaseDeadline, roundScores: { ...state.roundScores }, screen: state.screen,
  };
}

function usedWithCurrent(state: SessionStore): string[] {
  const id = state.questionQueue[state.questionIndex];
  return id && !state.usedQuestionIds.includes(id) ? [...state.usedQuestionIds, id] : state.usedQuestionIds;
}

function nextQuestionState(state: SessionStore, autoStartSpeed: boolean): Partial<SessionStore> {
  if (!state.currentGameId) return {};
  const game = gameRegistry[state.currentGameId];
  const settings = state.settingsByGame[state.currentGameId];
  const nextIndex = state.questionIndex + 1;
  if (nextIndex >= state.questionQueue.length) {
    return { questionIndex: nextIndex, screen: "round_result", roundNumber: state.roundNumber + 1,
      phase: "revealed", roundTimerStatus: "paused", roundDeadline: null,
      phaseTimerStatus: "paused", phaseDeadline: null };
  }
  if (game.engine === "speed" && autoStartSpeed) {
    if (state.currentGameId === "charades") {
      const now = Date.now();
      const roundRemainingMs = state.roundDeadline ? Math.max(0, state.roundDeadline - now) : state.roundRemainingMs;
      const previewMs = (settings.previewDurationSec ?? 3) * 1000;
      return { questionIndex: nextIndex, stageIndex: 0, phase: "preview", attemptingTeamId: null, lockedTeamIds: [],
        roundTimerStatus: "paused", roundRemainingMs, roundDeadline: null,
        phaseTimerStatus: "running", phaseRemainingMs: previewMs, phaseDeadline: now + previewMs };
    }
    return { questionIndex: nextIndex, stageIndex: 0, phase: "active", attemptingTeamId: null, lockedTeamIds: [] };
  }
  return { questionIndex: nextIndex, stageIndex: 0, phase: "ready", attemptingTeamId: null, lockedTeamIds: [],
    phaseTimerStatus: "idle", phaseRemainingMs: phaseDurationMs(settings), phaseDeadline: null };
}

function advanceStage(state: SessionStore, now: number): Partial<SessionStore> {
  if (!state.currentGameId) return {};
  const settings = state.settingsByGame[state.currentGameId];
  const lastStage = Math.max(0, (settings.stageCount ?? settings.stageScores?.length ?? 1) - 1);
  if (state.stageIndex >= lastStage) {
    return { phase: "revealed", attemptingTeamId: null, lockedTeamIds: [], usedQuestionIds: usedWithCurrent(state),
      phaseTimerStatus: "expired", phaseRemainingMs: 0, phaseDeadline: null };
  }
  const duration = phaseDurationMs(settings);
  return { stageIndex: state.stageIndex + 1, phase: "active", attemptingTeamId: null, lockedTeamIds: [],
    phaseTimerStatus: "running", phaseRemainingMs: duration, phaseDeadline: now + duration };
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessionId: crypto.randomUUID(), screen: "home", teams: createTeams(),
      selectedGameIds: [...Object.keys(gameRegistry)] as MvpGameType[], currentGameId: null,
      currentTeamId: "team-1", settingsByGame: defaultSettings(), filter: { ...defaultFilter },
      questionQueue: [], questionIndex: 0, stageIndex: 0, roundNumber: 1, usedQuestionIds: [],
      phase: "ready", attemptingTeamId: null, lockedTeamIds: [],
      roundTimerStatus: "idle", roundRemainingMs: 0, roundDeadline: null,
      phaseTimerStatus: "idle", phaseRemainingMs: 0, phaseDeadline: null,
      roundScores: {}, history: [],

      setScreen: (screen) => set({ screen }),
      setTeamCount: (count) => set((state) => {
        const safeCount = Math.min(4, Math.max(2, count));
        const teams = Array.from({ length: safeCount }, (_, index) => state.teams[index] ?? createTeams(safeCount)[index]);
        return { teams, currentTeamId: teams.some((team) => team.id === state.currentTeamId) ? state.currentTeamId : teams[0].id };
      }),
      updateTeam: (teamId, updates) => set((state) => ({ teams: state.teams.map((team) => team.id === teamId ? { ...team, ...updates } : team) })),
      toggleGame: (gameId) => set((state) => ({ selectedGameIds: state.selectedGameIds.includes(gameId) ? state.selectedGameIds.filter((id) => id !== gameId) : [...state.selectedGameIds, gameId] })),
      selectGame: (gameId) => set({ currentGameId: gameId, screen: "game_intro", history: [] }),
      selectTeam: (teamId) => set({ currentTeamId: teamId }),
      updateSettings: (gameId, updates) => set((state) => ({ settingsByGame: { ...state.settingsByGame, [gameId]: { ...state.settingsByGame[gameId], ...updates } } })),
      updateFilter: (updates) => set((state) => ({ filter: { ...state.filter, ...updates } })),
      startRound: (questionIds) => {
        const state = get();
        if (!state.currentGameId || questionIds.length === 0) return;
        const game = gameRegistry[state.currentGameId];
        const settings = state.settingsByGame[state.currentGameId];
        const limit = game.engine === "speed" ? questionIds.length : (settings.roundQuestionCount ?? (game.engine === "standard" ? 10 : 5));
        const queue = questionIds.slice(0, limit);
        if (queue.length < limit) return;
        set({ questionQueue: queue, questionIndex: 0, stageIndex: 0, screen: "game_play", phase: "ready",
          attemptingTeamId: null, lockedTeamIds: [], roundTimerStatus: "idle",
          roundRemainingMs: game.engine === "speed" ? (settings.roundDurationSec ?? 60) * 1000 : 0, roundDeadline: null,
          phaseTimerStatus: "idle", phaseRemainingMs: game.engine === "speed" ? 0 : phaseDurationMs(settings), phaseDeadline: null,
          roundScores: initialRoundScores(state.teams), history: [] });
      },
      dispatch: (action) => set((state) => {
        if (action.type === "UNDO") {
          const previous = state.history.at(-1);
          return previous ? { ...previous, history: state.history.slice(0, -1) } : state;
        }
        if (!state.currentGameId) return state;
        const game = gameRegistry[state.currentGameId];
        const settings = state.settingsByGame[state.currentGameId];
        const now = Date.now();
        const history = [...state.history.slice(-49), takeSnapshot(state)];
        if (action.type === "START") {
          if (state.phase !== "ready") return state;
          if (game.engine === "speed") {
            if (state.currentGameId === "charades") {
              const duration = (settings.previewDurationSec ?? 3) * 1000;
              return { phase: "preview", phaseTimerStatus: "running", phaseRemainingMs: duration, phaseDeadline: now + duration, history };
            }
            return { phase: "active", roundTimerStatus: "running", roundDeadline: now + state.roundRemainingMs, history };
          }
          return { phase: "active", phaseTimerStatus: "running", phaseDeadline: now + state.phaseRemainingMs, history };
        }
        if (action.type === "PAUSE") {
          if (state.phaseTimerStatus === "running") return { phaseTimerStatus: "paused", phaseRemainingMs: Math.max(0, (state.phaseDeadline ?? now) - now), phaseDeadline: null, history };
          if (state.roundTimerStatus === "running") return { roundTimerStatus: "paused", roundRemainingMs: Math.max(0, (state.roundDeadline ?? now) - now), roundDeadline: null, history };
          return state;
        }
        if (action.type === "RESUME") {
          if (state.phaseTimerStatus === "paused") return { phaseTimerStatus: "running", phaseDeadline: now + state.phaseRemainingMs, history };
          if (state.roundTimerStatus === "paused" && state.phase === "active") return { roundTimerStatus: "running", roundDeadline: now + state.roundRemainingMs, history };
          return state;
        }
        if (action.type === "ATTEMPT") {
          if (game.engine !== "progressive" || state.phase !== "active" || state.lockedTeamIds.includes(action.teamId)) return state;
          return { phase: "attempt", attemptingTeamId: action.teamId, phaseTimerStatus: "paused",
            phaseRemainingMs: Math.max(0, (state.phaseDeadline ?? now) - now), phaseDeadline: null, history };
        }
        if (action.type === "CORRECT") {
          if (["ready", "revealed", "preview"].includes(state.phase)) return state;
          const teamId = state.attemptingTeamId ?? action.teamId;
          const points = game.engine === "progressive" ? (settings.stageScores?.[state.stageIndex] ?? 1) : (settings.scorePerCorrect ?? settings.scoreOnSuccess ?? 1);
          const teams = state.teams.map((team) => team.id === teamId ? { ...team, score: team.score + points } : team);
          const roundScores = { ...state.roundScores, [teamId]: (state.roundScores[teamId] ?? 0) + points };
          const base = { teams, roundScores, usedQuestionIds: usedWithCurrent(state), history };
          if (game.engine === "speed") return { ...base, ...nextQuestionState(state, true) };
          return { ...base, phase: "revealed" as const, attemptingTeamId: null, phaseTimerStatus: "paused" as const, phaseDeadline: null };
        }
        if (action.type === "PASS") {
          if (game.engine !== "speed" || !settings.allowPass || state.phase !== "active") return state;
          return { usedQuestionIds: usedWithCurrent(state), ...nextQuestionState(state, true), history };
        }
        if (action.type === "WRONG") {
          const teamId = state.attemptingTeamId ?? action.teamId ?? state.currentTeamId;
          if (game.engine === "progressive" && settings.wrongAnswerPolicy === "LOCK_CURRENT_STAGE") {
            const lockedTeamIds = [...new Set([...state.lockedTeamIds, teamId])];
            if (lockedTeamIds.length >= state.teams.length) return { ...advanceStage({ ...state, lockedTeamIds }, now), history };
            return { phase: "active", attemptingTeamId: null, lockedTeamIds, phaseTimerStatus: "running", phaseDeadline: now + state.phaseRemainingMs, history };
          }
          return { phase: "revealed", attemptingTeamId: null, usedQuestionIds: usedWithCurrent(state), phaseTimerStatus: "paused", phaseDeadline: null, history };
        }
        if (action.type === "NEXT_STAGE") return { ...advanceStage(state, now), history };
        if (action.type === "REVEAL") return { phase: "revealed", attemptingTeamId: null, usedQuestionIds: usedWithCurrent(state), phaseTimerStatus: "paused", phaseDeadline: null, history };
        if (action.type === "NEXT") return { usedQuestionIds: usedWithCurrent(state), ...nextQuestionState(state, false), history };
        if (action.type === "END") return { screen: "round_result", phase: "revealed", roundTimerStatus: "paused", roundDeadline: null, phaseTimerStatus: "paused", phaseDeadline: null, roundNumber: state.roundNumber + 1, history };
        return state;
      }),
      tick: (now) => set((state) => {
        if (!state.currentGameId) return state;
        const game = gameRegistry[state.currentGameId];
        if (state.phaseTimerStatus === "running" && state.phaseDeadline !== null) {
          const remaining = Math.max(0, state.phaseDeadline - now);
          if (remaining > 0) return { phaseRemainingMs: remaining };
          if (state.phase === "preview") return { phase: "active", phaseTimerStatus: "idle", phaseRemainingMs: 0, phaseDeadline: null,
            roundTimerStatus: "running", roundDeadline: now + state.roundRemainingMs };
          if (game.engine === "progressive") return advanceStage(state, now);
          return { phase: "attempt", phaseTimerStatus: "expired", phaseRemainingMs: 0, phaseDeadline: null };
        }
        if (state.roundTimerStatus === "running" && state.roundDeadline !== null) {
          const remaining = Math.max(0, state.roundDeadline - now);
          if (remaining > 0) return { roundRemainingMs: remaining };
          return { roundRemainingMs: 0, roundTimerStatus: "expired", roundDeadline: null, phase: "revealed", screen: "round_result", roundNumber: state.roundNumber + 1 };
        }
        return state;
      }),
      clearUsedQuestions: () => set({ usedQuestionIds: [] }),
      newSession: () => {
        const teams = createTeams();
        set({ sessionId: crypto.randomUUID(), screen: "session_setup", teams,
          selectedGameIds: [...Object.keys(gameRegistry)] as MvpGameType[], currentGameId: null,
          currentTeamId: teams[0].id, settingsByGame: defaultSettings(), filter: { ...defaultFilter },
          questionQueue: [], questionIndex: 0, stageIndex: 0, roundNumber: 1, usedQuestionIds: [],
          phase: "ready", attemptingTeamId: null, lockedTeamIds: [],
          roundTimerStatus: "idle", roundRemainingMs: 0, roundDeadline: null,
          phaseTimerStatus: "idle", phaseRemainingMs: 0, phaseDeadline: null, roundScores: {}, history: [] });
      },
    }),
    {
      name: "party-quiz-session", version: 5,
      migrate: (persisted) => {
        const previous = (persisted ?? {}) as Partial<SessionStore>;
        const defaults = defaultSettings();
        const teams = previous.teams ?? createTeams();
        const settingsByGame = Object.fromEntries(Object.entries(defaults).map(([id, value]) => [id, { ...value, ...(previous.settingsByGame?.[id as MvpGameType] ?? {}) }])) as Record<MvpGameType, GameSettings>;
        settingsByGame.football_career = {
          ...settingsByGame.football_career,
          stageCount: 1,
          stageScores: [1],
          allowPass: false,
          wrongAnswerPolicy: "LOCK_CURRENT_STAGE",
        };
        return {
          sessionId: previous.sessionId ?? crypto.randomUUID(),
          screen: previous.screen === "game_play" ? "game_setup" : (previous.screen ?? "home"),
          teams,
          selectedGameIds: previous.selectedGameIds ?? ([...Object.keys(gameRegistry)] as MvpGameType[]),
          currentGameId: previous.currentGameId ?? null,
          currentTeamId: previous.currentTeamId ?? teams[0].id,
          settingsByGame,
          filter: { ...defaultFilter, ...(previous.filter ?? {}) },
          roundNumber: previous.roundNumber ?? 1,
          usedQuestionIds: previous.usedQuestionIds ?? [],
        };
      },
      partialize: (state) => ({ sessionId: state.sessionId, screen: state.screen === "game_play" ? "game_setup" : state.screen,
        teams: state.teams, selectedGameIds: state.selectedGameIds, currentGameId: state.currentGameId,
        currentTeamId: state.currentTeamId, settingsByGame: state.settingsByGame, filter: state.filter,
        roundNumber: state.roundNumber, usedQuestionIds: state.usedQuestionIds }),
    },
  ),
);
