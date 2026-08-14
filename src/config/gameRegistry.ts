import type { GameDefinition, MvpGameType } from "../domain/types";
import { defaultConfig } from "./defaults";

export const gameRegistry: Record<MvpGameType, GameDefinition> = {
  person_quiz: {
    id: "person_quiz",
    label: "인물 퀴즈",
    shortDescription: "사진 속 인물을 제한시간 안에 맞혀보세요.",
    engine: "speed",
    accent: "#e14d3a",
    defaultSettings: defaultConfig.games.person_quiz,
  },
  charades: {
    id: "charades",
    label: "몸으로 말해요",
    shortDescription: "말하지 않고 몸짓만으로 제시어를 설명하세요.",
    engine: "speed",
    accent: "#1e8f65",
    defaultSettings: defaultConfig.games.charades,
  },
  four_syllable: {
    id: "four_syllable",
    label: "네 글자 이어말하기",
    shortDescription: "앞의 두 글자를 보고 나머지를 완성하세요.",
    engine: "speed",
    accent: "#3973c6",
    defaultSettings: defaultConfig.games.four_syllable,
  },
  three_in_time: {
    id: "three_in_time",
    label: "5초 안에 3개",
    shortDescription: "주제에 맞는 답을 제한시간 안에 말하세요.",
    engine: "standard",
    accent: "#e29b23",
    defaultSettings: defaultConfig.games.three_in_time,
  },
  progressive_hint: {
    id: "progressive_hint",
    label: "3단 힌트 퀴즈",
    shortDescription: "적은 힌트로 맞힐수록 높은 점수를 얻습니다.",
    engine: "progressive",
    accent: "#8d5bb7",
    defaultSettings: defaultConfig.games.progressive_hint,
  },
  football_career: {
    id: "football_career",
    label: "선수 커리어 맞히기",
    shortDescription: "공개되는 소속 클럽 경력으로 선수를 맞히세요.",
    engine: "progressive",
    accent: "#167f8d",
    defaultSettings: defaultConfig.games.football_career,
  },
};

export const gameDefinitions = Object.values(gameRegistry);
