import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import type { MvpQuestion } from "../src/domain/types";
import { MVP_GAME_TYPES } from "../src/domain/types";
import { questionSchema } from "../src/data/schema";

export interface DataIssue {
  file: string;
  index?: number;
  message: string;
}

export interface DataScanResult {
  questions: MvpQuestion[];
  issues: DataIssue[];
  files: string[];
}

function jsonFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return jsonFiles(path);
    return extname(entry.name) === ".json" ? [path] : [];
  });
}

function normalize(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");
}

export function scanData(projectRoot = resolve(import.meta.dirname, "..")): DataScanResult {
  const dataRoot = join(projectRoot, "data");
  const files = jsonFiles(dataRoot);
  const questions: MvpQuestion[] = [];
  const issues: DataIssue[] = [];
  const ids = new Map<string, string>();
  const fingerprints = new Map<string, string>();
  const fourSyllablePrompts = new Map<string, string>();

  for (const filePath of files) {
    const file = relative(projectRoot, filePath);
    let content: unknown;
    try {
      content = JSON.parse(readFileSync(filePath, "utf8"));
    } catch (error) {
      issues.push({ file, message: `JSON 파싱 실패: ${(error as Error).message}` });
      continue;
    }
    if (!Array.isArray(content)) {
      issues.push({ file, message: "최상위 값은 배열이어야 합니다." });
      continue;
    }

    content.forEach((raw, index) => {
      const result = questionSchema.safeParse(raw);
      if (!result.success) {
        for (const issue of result.error.issues) {
          issues.push({ file, index, message: `${issue.path.join(".") || "question"}: ${issue.message}` });
        }
        return;
      }
      const question = result.data as MvpQuestion;
      questions.push(question);

      const existingId = ids.get(question.id);
      if (existingId) issues.push({ file, index, message: `중복 ID ${question.id} (기존: ${existingId})` });
      else ids.set(question.id, file);

      if (question.answer) {
        const acceptedAnswers = new Set((question.acceptedAnswers ?? []).map(normalize));
        if (!acceptedAnswers.has(normalize(question.answer))) {
          issues.push({ file, index, message: "acceptedAnswers에 기본 answer가 포함되어야 합니다." });
        }
      }

      const accepted = question.acceptedAnswers ?? [];
      if (new Set(accepted.map(normalize)).size !== accepted.length) {
        issues.push({ file, index, message: "acceptedAnswers에 정규화 후 중복되는 값이 있습니다." });
      }

      const metadata = question.metadata as Record<string, unknown> | undefined;
      const prompt = typeof metadata?.prompt === "string" ? metadata.prompt : "";
      const fingerprintValue = question.gameType === "four_syllable"
        ? question.metadata.fullAnswer
        : question.answer ?? prompt;
      const fingerprint = `${question.gameType}:${normalize(fingerprintValue)}`;
      const existingFingerprint = fingerprints.get(fingerprint);
      if (existingFingerprint) issues.push({ file, index, message: `동일 게임 내 중복 후보 (기존: ${existingFingerprint})` });
      else fingerprints.set(fingerprint, `${file}[${index}]`);

      if (question.asset) {
        const assetPath = join(projectRoot, "public", question.asset.replace(/^\//, ""));
        if (!existsSync(assetPath)) issues.push({ file, index, message: `에셋 파일 없음: ${question.asset}` });
      }

      if (question.gameType === "four_syllable") {
        const compactPrompt = question.metadata.prompt.replace(/\s/g, "");
        const compactAnswer = question.answer.replace(/\s/g, "");
        if (`${question.metadata.prompt}${question.answer}` !== question.metadata.fullAnswer) issues.push({ file, index, message: "prompt + answer가 fullAnswer와 일치하지 않습니다." });
        if ([...compactPrompt].length !== 2 || [...compactAnswer].length !== 2) issues.push({ file, index, message: "prompt와 answer는 각각 2음절이어야 합니다." });
        const existingPrompt = fourSyllablePrompts.get(normalize(compactPrompt));
        if (existingPrompt) issues.push({ file, index, message: `동일 앞말 중복 (기존: ${existingPrompt})` });
        else fourSyllablePrompts.set(normalize(compactPrompt), `${file}[${index}]`);
      }

      if (question.gameType === "three_in_time") {
        if (new Set(question.metadata.examples.map(normalize)).size !== question.metadata.examples.length) issues.push({ file, index, message: "판정 예시에 중복이 있습니다." });
      }

      if (question.gameType === "football_career") {
        question.metadata.career.forEach((entry, careerIndex) => {
          if (entry.order !== careerIndex + 1) issues.push({ file, index, message: "career order는 1부터 순차 증가해야 합니다." });
        });
        if (!question.sources?.length) issues.push({ file, index, message: "선수 커리어에는 검증 출처가 필요합니다." });
      }
    });
  }

  for (const gameType of MVP_GAME_TYPES) {
    const gameQuestions = questions.filter((question) => question.gameType === gameType);
    if (gameQuestions.length < 100) issues.push({ file: "data", message: `${gameType}: 최소 100문항이어야 합니다. (현재 ${gameQuestions.length})` });
    if (gameQuestions.some((question) => !question.enabled || !question.verified)) issues.push({ file: "data", message: `${gameType}: 모든 문항이 활성·검증 상태여야 합니다.` });
    const boundaries = [0, 0.2, 0.45, 0.75, 0.95, 1].map((ratio) => Math.floor(gameQuestions.length * ratio));
    const expectedDifficulty = boundaries.slice(0, 5).map((start, index) => boundaries[index + 1] - start);
    expectedDifficulty.forEach((expected, difficultyIndex) => {
      const actual = gameQuestions.filter((question) => question.difficulty === difficultyIndex + 1).length;
      if (actual !== expected) issues.push({ file: "data", message: `${gameType}: 난이도 ${difficultyIndex + 1}은 ${expected}문항이어야 합니다. (현재 ${actual})` });
    });
  }

  const people = questions.filter((question) => question.gameType === "person_quiz");
  if (people.some((question) => !question.asset || !question.attribution || !question.sources?.length)) issues.push({ file: "data", message: "모든 인물 문항에는 로컬 이미지·라이선스·출처가 필요합니다." });

  return { questions, issues, files };
}
