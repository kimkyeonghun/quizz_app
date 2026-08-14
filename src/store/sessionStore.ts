import { create } from "zustand";
import { persist } from "zustand/middleware";
import { gameRegistry } from "../config/gameRegistry";
import type {
  AppScreen,
  FilterSettings,
  GameSettings,
  HostAction,
  MvpGameType,
  Team,
  TimerStatus,
} from "../domain/types";

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
  questionOrder: "random",
};

function defaultSettings(): Record<MvpGameType, GameSettings> {
  return Object.fromEntries(
    Object.entries(gameRegistry).map(([id, game]) => [id, { ...game.defaultSettings }]),
  ) as Record<MvpGameType, GameSettings>;
}

interface SessionSnapshot {
  teams: Team[];
  currentTeamId: string;
  questionIndex: number;
  stageIndex: number;
  usedQuestionIds: string[];
  timerStatus: TimerStatus;
  remainingMs: number;
  deadline: number | null;
  revealed: boolean;
  pendingDecision: boolean;
  roundScores: Record<string, number>;
  screen: AppScreen;
}

interface SessionStore {
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
  timerStatus: TimerStatus;
  remainingMs: number;
  deadline: number | null;
  revealed: boolean;
  pendingDecision: boolean;
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

function getDurationMs(gameId: MvpGameType, settings: GameSettings): number {
  const game = gameRegistry[gameId];
  if (game.engine === "speed") return (settings.roundDurationSec ?? 60) * 1000;
  if (game.engine === "progressive") return (settings.stageDurationSec ?? 15) * 1000;
  return (settings.questionDurationSec ?? 5) * 1000;
}

function takeSnapshot(state: SessionStore): SessionSnapshot {
  return {
    teams: state.teams.map((team) => ({ ...team })),
    currentTeamId: state.currentTeamId,
    questionIndex: state.questionIndex,
    stageIndex: state.stageIndex,
    usedQuestionIds: [...state.usedQuestionIds],
    timerStatus: state.timerStatus,
    remainingMs: state.remainingMs,
    deadline: state.deadline,
    revealed: state.revealed,
    pendingDecision: state.pendingDecision,
    roundScores: { ...state.roundScores },
    screen: state.screen,
  };
}

function nextTeamId(teams: Team[], currentTeamId: string): string {
  const currentIndex = teams.findIndex((team) => team.id === currentTeamId);
  return teams[(currentIndex + 1) % teams.length]?.id ?? teams[0].id;
}

function initialRoundScores(teams: Team[]): Record<string, number> {
  return Object.fromEntries(teams.map((team) => [team.id, 0]));
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessionId: crypto.randomUUID(),
      screen: "home",
      teams: createTeams(),
      selectedGameIds: [...Object.keys(gameRegistry)] as MvpGameType[],
      currentGameId: null,
      currentTeamId: "team-1",
      settingsByGame: defaultSettings(),
      filter: { ...defaultFilter },
      questionQueue: [],
      questionIndex: 0,
      stageIndex: 0,
      roundNumber: 1,
      usedQuestionIds: [],
      timerStatus: "idle",
      remainingMs: 0,
      deadline: null,
      revealed: false,
      pendingDecision: false,
      roundScores: {},
      history: [],

      setScreen: (screen) => set({ screen }),
      setTeamCount: (count) =>
        set((state) => {
          const safeCount = Math.min(4, Math.max(2, count));
          const teams = Array.from({ length: safeCount }, (_, index) =>
            state.teams[index] ?? createTeams(safeCount)[index],
          );
          return {
            teams,
            currentTeamId: teams.some((team) => team.id === state.currentTeamId)
              ? state.currentTeamId
              : teams[0].id,
          };
        }),
      updateTeam: (teamId, updates) =>
        set((state) => ({
          teams: state.teams.map((team) => (team.id === teamId ? { ...team, ...updates } : team)),
        })),
      toggleGame: (gameId) =>
        set((state) => ({
          selectedGameIds: state.selectedGameIds.includes(gameId)
            ? state.selectedGameIds.filter((id) => id !== gameId)
            : [...state.selectedGameIds, gameId],
        })),
      selectGame: (gameId) =>
        set({ currentGameId: gameId, screen: "game_intro", history: [] }),
      selectTeam: (teamId) => set({ currentTeamId: teamId }),
      updateSettings: (gameId, updates) =>
        set((state) => ({
          settingsByGame: {
            ...state.settingsByGame,
            [gameId]: { ...state.settingsByGame[gameId], ...updates },
          },
        })),
      updateFilter: (updates) => set((state) => ({ filter: { ...state.filter, ...updates } })),
      startRound: (questionIds) => {
        const state = get();
        if (!state.currentGameId || questionIds.length === 0) return;
        const duration = getDurationMs(
          state.currentGameId,
          state.settingsByGame[state.currentGameId],
        );
        set({
          questionQueue: questionIds,
          questionIndex: 0,
          stageIndex: 0,
          screen: "game_play",
          timerStatus: "idle",
          remainingMs: duration,
          deadline: null,
          revealed: false,
          pendingDecision: false,
          roundScores: initialRoundScores(state.teams),
          history: [],
        });
      },
      dispatch: (action) =>
        set((state) => {
          if (action.type === "UNDO") {
            const previous = state.history.at(-1);
            if (!previous) return state;
            return { ...previous, history: state.history.slice(0, -1) };
          }

          if (!state.currentGameId) return state;
          const game = gameRegistry[state.currentGameId];
          const settings = state.settingsByGame[state.currentGameId];
          const duration = getDurationMs(state.currentGameId, settings);
          const history = [...state.history.slice(-49), takeSnapshot(state)];
          const currentQuestionId = state.questionQueue[state.questionIndex];
          const markUsed = currentQuestionId && !state.usedQuestionIds.includes(currentQuestionId)
            ? [...state.usedQuestionIds, currentQuestionId]
            : state.usedQuestionIds;

          if (action.type === "START" || action.type === "RESUME") {
            if (state.timerStatus === "running" || state.timerStatus === "expired") return state;
            return {
              timerStatus: "running",
              deadline: Date.now() + state.remainingMs,
              history,
            };
          }
          if (action.type === "PAUSE") {
            if (state.timerStatus !== "running") return state;
            return {
              timerStatus: "paused",
              remainingMs: Math.max(0, (state.deadline ?? Date.now()) - Date.now()),
              deadline: null,
              history,
            };
          }
          if (action.type === "CORRECT") {
            if (state.revealed) return state;
            const points = game.engine === "progressive"
              ? (settings.stageScores?.[state.stageIndex] ?? 1)
              : (settings.scorePerCorrect ?? settings.scoreOnSuccess ?? 1);
            const teams = state.teams.map((team) =>
              team.id === action.teamId ? { ...team, score: team.score + points } : team,
            );
            const roundScores = {
              ...state.roundScores,
              [action.teamId]: (state.roundScores[action.teamId] ?? 0) + points,
            };
            if (game.engine === "speed") {
              const nextIndex = state.questionIndex + 1;
              return {
                teams,
                roundScores,
                usedQuestionIds: markUsed,
                questionIndex: nextIndex,
                screen: nextIndex >= state.questionQueue.length ? "round_result" : state.screen,
                roundNumber: nextIndex >= state.questionQueue.length ? state.roundNumber + 1 : state.roundNumber,
                timerStatus: nextIndex >= state.questionQueue.length ? "paused" : state.timerStatus,
                deadline: nextIndex >= state.questionQueue.length ? null : state.deadline,
                history,
              };
            }
            return {
              teams,
              roundScores,
              usedQuestionIds: markUsed,
              revealed: true,
              timerStatus: "paused",
              deadline: null,
              history,
            };
          }
          if (action.type === "PASS") {
            const nextIndex = state.questionIndex + 1;
            if (game.engine === "speed") {
              return {
                usedQuestionIds: markUsed,
                questionIndex: nextIndex,
                screen: nextIndex >= state.questionQueue.length ? "round_result" : state.screen,
                roundNumber: nextIndex >= state.questionQueue.length ? state.roundNumber + 1 : state.roundNumber,
                timerStatus: nextIndex >= state.questionQueue.length ? "paused" : state.timerStatus,
                deadline: nextIndex >= state.questionQueue.length ? null : state.deadline,
                history,
              };
            }
            return {
              usedQuestionIds: markUsed,
              revealed: true,
              timerStatus: "paused",
              deadline: null,
              history,
            };
          }
          if (action.type === "WRONG") {
            if (settings.wrongAnswerPolicy === "STEAL") {
              return {
                currentTeamId: nextTeamId(state.teams, state.currentTeamId),
                pendingDecision: false,
                history,
              };
            }
            if (settings.wrongAnswerPolicy === "END_QUESTION") {
              return {
                usedQuestionIds: markUsed,
                revealed: true,
                timerStatus: "paused",
                deadline: null,
                history,
              };
            }
            if (settings.wrongAnswerPolicy === "HOST_DECIDES") {
              return { pendingDecision: true, timerStatus: "paused", deadline: null, history };
            }
            return { pendingDecision: false, history };
          }
          if (action.type === "STEAL") {
            return { currentTeamId: action.teamId, pendingDecision: false, history };
          }
          if (action.type === "RETRY") {
            return { pendingDecision: false, timerStatus: "paused", deadline: null, history };
          }
          if (action.type === "NEXT_STAGE") {
            const lastStage = Math.max(0, (settings.stageScores?.length ?? 3) - 1);
            if (state.stageIndex >= lastStage) {
              return { revealed: true, timerStatus: "paused", deadline: null, history };
            }
            return {
              stageIndex: state.stageIndex + 1,
              timerStatus: "idle",
              remainingMs: duration,
              deadline: null,
              pendingDecision: false,
              history,
            };
          }
          if (action.type === "REVEAL") {
            return {
              usedQuestionIds: markUsed,
              revealed: true,
              timerStatus: "paused",
              deadline: null,
              pendingDecision: false,
              history,
            };
          }
          if (action.type === "NEXT") {
            const nextIndex = state.questionIndex + 1;
            return {
              usedQuestionIds: markUsed,
              questionIndex: nextIndex,
              stageIndex: 0,
              revealed: false,
              pendingDecision: false,
              timerStatus: "idle",
              remainingMs: duration,
              deadline: null,
              screen: nextIndex >= state.questionQueue.length ? "round_result" : state.screen,
              roundNumber: nextIndex >= state.questionQueue.length ? state.roundNumber + 1 : state.roundNumber,
              history,
            };
          }
          if (action.type === "END") {
            return {
              screen: "round_result",
              timerStatus: "paused",
              deadline: null,
              roundNumber: state.roundNumber + 1,
              history,
            };
          }
          return state;
        }),
      tick: (now) =>
        set((state) => {
          if (state.timerStatus !== "running" || state.deadline === null) return state;
          const remainingMs = Math.max(0, state.deadline - now);
          if (remainingMs > 0) return { remainingMs };
          const game = state.currentGameId ? gameRegistry[state.currentGameId] : null;
          return {
            remainingMs: 0,
            timerStatus: "expired",
            deadline: null,
            screen: game?.engine === "speed" ? "round_result" : state.screen,
            roundNumber: game?.engine === "speed" ? state.roundNumber + 1 : state.roundNumber,
          };
        }),
      clearUsedQuestions: () => set({ usedQuestionIds: [] }),
      newSession: () => {
        const teams = createTeams();
        set({
          sessionId: crypto.randomUUID(),
          screen: "session_setup",
          teams,
          selectedGameIds: [...Object.keys(gameRegistry)] as MvpGameType[],
          currentGameId: null,
          currentTeamId: teams[0].id,
          settingsByGame: defaultSettings(),
          filter: { ...defaultFilter },
          questionQueue: [],
          questionIndex: 0,
          stageIndex: 0,
          roundNumber: 1,
          usedQuestionIds: [],
          timerStatus: "idle",
          remainingMs: 0,
          deadline: null,
          revealed: false,
          pendingDecision: false,
          roundScores: {},
          history: [],
        });
      },
    }),
    {
      name: "party-quiz-session",
      version: 1,
      partialize: (state) => ({
        sessionId: state.sessionId,
        screen: state.screen === "game_play" ? "game_setup" : state.screen,
        teams: state.teams,
        selectedGameIds: state.selectedGameIds,
        currentGameId: state.currentGameId,
        currentTeamId: state.currentTeamId,
        settingsByGame: state.settingsByGame,
        filter: state.filter,
        roundNumber: state.roundNumber,
        usedQuestionIds: state.usedQuestionIds,
      }),
    },
  ),
);
