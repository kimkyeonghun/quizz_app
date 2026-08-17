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
    guide: {
      objective: "화면에 나온 인물의 이름을 제한시간 안에 최대한 많이 맞히는 속도전입니다.",
      steps: [
        "도전 팀과 라운드 시간을 정합니다.",
        "인물 사진이 나타나면 팀원이 이름을 말합니다.",
        "사회자가 정답 또는 패스를 누르면 바로 다음 인물로 넘어갑니다.",
        "시간이 끝나면 맞힌 인원 수만큼 점수를 얻습니다.",
      ],
      scoring: ["정답마다 설정한 점수를 획득합니다.", "패스와 오답에는 점수가 없습니다."],
      hostTips: ["사진 에셋이 준비된 문제만 선택했는지 확인하세요.", "인정 가능한 영문명과 별명은 acceptedAnswers를 참고하세요."],
    },
  },
  charades: {
    id: "charades",
    label: "몸으로 말해요",
    shortDescription: "말하지 않고 몸짓만으로 제시어를 설명하세요.",
    engine: "speed",
    accent: "#1e8f65",
    defaultSettings: defaultConfig.games.charades,
    guide: {
      objective: "설명자 한 명이 말하지 않고 몸짓만 사용해 제시어를 팀원에게 전달하는 게임입니다.",
      steps: [
        "도전 팀에서 설명자 한 명을 정합니다.",
        "나머지 팀원이 뒤돌아 있는 동안 설명자만 3초간 제시어를 확인합니다.",
        "제시어가 숨겨지면 말·소리·글자·숫자·도구 없이 몸으로 설명합니다.",
        "팀이 맞히면 정답, 어렵다면 패스를 눌러 다음 문제로 진행합니다.",
      ],
      scoring: ["제한시간 동안 맞힌 문제마다 설정 점수를 획득합니다.", "금지 행동을 사용한 문제는 오답 처리할 수 있습니다."],
      hostTips: ["설명자가 단어를 소리 내어 말하지 않도록 확인하세요.", "화면이 다른 팀원에게 보이지 않도록 위치를 조정하면 더 공정합니다."],
    },
  },
  four_syllable: {
    id: "four_syllable",
    label: "네 글자 이어말하기",
    shortDescription: "앞의 두 글자를 보고 나머지를 완성하세요.",
    engine: "speed",
    accent: "#3973c6",
    defaultSettings: defaultConfig.games.four_syllable,
    guide: {
      objective: "앞부분을 보고 이어지는 말을 빠르게 완성하는 속도형 단어 게임입니다.",
      steps: [
        "화면에 단어의 앞부분이 표시됩니다.",
        "도전 팀은 이어지는 뒷부분을 말합니다.",
        "사회자가 정답 또는 패스를 판정합니다.",
        "제한시간 동안 가능한 많은 단어를 완성합니다.",
      ],
      scoring: ["완성한 단어마다 설정 점수를 획득합니다.", "정확한 전체 단어가 성립해야 정답입니다."],
      hostTips: ["동음이의어나 자연스러운 변형은 사회자가 현장에서 판단하세요.", "정답 판정이 애매하면 전체 정답을 확인한 뒤 결정하세요."],
    },
  },
  three_in_time: {
    id: "three_in_time",
    label: "5초 안에 3개",
    shortDescription: "주제에 맞는 답을 제한시간 안에 말하세요.",
    engine: "standard",
    accent: "#e29b23",
    defaultSettings: defaultConfig.games.three_in_time,
    guide: {
      objective: "주어진 주제에 맞는 답을 짧은 제한시간 안에 지정된 개수만큼 말하는 게임입니다.",
      steps: [
        "주제와 필요한 답변 개수를 확인합니다.",
        "문제가 공개되는 동시에 5초 타이머가 시작됩니다.",
        "시간 안에 필요한 개수를 채우면 사회자가 정답을 누릅니다.",
        "실패하거나 시간이 끝나면 다음 문제로 넘어갑니다.",
      ],
      scoring: ["필요한 답변 수를 모두 채웠을 때만 성공 점수를 획득합니다.", "중복 답변과 조건에 맞지 않는 답은 개수에 포함하지 않습니다."],
      hostTips: ["시작 전에 요구 개수와 제한시간을 참가자에게 알려주세요.", "자동 채점이 아니므로 답변 개수를 소리 내어 세면 진행이 쉽습니다."],
    },
  },
  progressive_hint: {
    id: "progressive_hint",
    label: "3단 힌트 퀴즈",
    shortDescription: "적은 힌트로 맞힐수록 높은 점수를 얻습니다.",
    engine: "progressive",
    accent: "#8d5bb7",
    defaultSettings: defaultConfig.games.progressive_hint,
    guide: {
      objective: "힌트를 한 단계씩 공개하며 적은 힌트만 보고 정답을 맞히는 게임입니다.",
      steps: [
        "첫 번째 힌트와 15초 타이머를 공개하고 모든 팀의 도전을 받습니다.",
        "정답이 나오지 않으면 다음 힌트를 공개합니다.",
        "오답 팀은 현재 단계에서 잠기며 다음 힌트부터 다시 참여합니다.",
        "정답이 나오거나 모든 힌트를 사용하면 문제를 종료합니다.",
      ],
      scoring: ["첫 단계 점수가 가장 높고 힌트를 추가할수록 점수가 낮아집니다.", "현재 단계에 설정된 점수가 정답 팀에 적용됩니다."],
      hostTips: ["팀이 답을 확정한 뒤에만 오답 버튼을 누르세요.", "힌트를 읽을 시간을 준 뒤 다음 단계를 공개하세요."],
    },
  },
  football_career: {
    id: "football_career",
    label: "선수 커리어 맞히기",
    shortDescription: "한 번에 공개되는 전체 소속 클럽 경력으로 선수를 맞히세요.",
    engine: "progressive",
    accent: "#167f8d",
    defaultSettings: defaultConfig.games.football_career,
    guide: {
      objective: "선수의 전체 소속 클럽 경력을 보고 20초 안에 어떤 선수인지 맞히는 축구 퀴즈입니다.",
      steps: [
        "실제 경력 순서의 모든 소속 클럽과 20초 타이머를 동시에 공개합니다.",
        "팀은 선수 이름을 말하고 사회자가 정답을 판정합니다.",
        "오답 팀은 해당 문제에서 잠기고 다른 팀은 계속 도전합니다.",
        "정답이 나오거나 시간이 끝나면 정답과 출처를 공개합니다.",
      ],
      scoring: ["정답 팀은 1점을 받습니다.", "모든 팀이 오답으로 잠기면 즉시 정답을 공개합니다."],
      hostTips: ["클럽은 화면에 표시된 순서대로 선수 경력을 나타냅니다.", "현역 선수 데이터는 verifiedAt 날짜를 확인하고 사용하세요."],
    },
  },
};

export const gameDefinitions = Object.values(gameRegistry);
