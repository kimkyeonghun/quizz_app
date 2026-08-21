import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { parseFile } from "music-metadata";
import sharp from "sharp";
import type { MvpQuestion, PlayableQuestion } from "../src/domain/types";
import { MVP_GAME_TYPES } from "../src/domain/types";
import { questionSchema } from "../src/data/schema";
import type { ValidationProfile } from "../src/data/contentTypes";
import { buildContentManifest, manifestDifferences, readContentManifest } from "./content-manifest";

export interface DataIssue {
  file: string;
  index?: number;
  questionId?: string;
  path?: string;
  code: string;
  message: string;
}

export interface DataScanResult {
  questions: PlayableQuestion[];
  issues: DataIssue[];
  files: string[];
}

export interface ScanDataOptions {
  root?: string;
  profile?: ValidationProfile;
  verifyManifest?: boolean;
}

function jsonFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return jsonFiles(path);
    return extname(entry.name) === ".json" && entry.name !== "content-manifest.json" ? [path] : [];
  });
}

function normalize(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");
}

export async function scanData(options: ScanDataOptions = {}): Promise<DataScanResult> {
  const projectRoot = resolve(options.root ?? resolve(import.meta.dirname, ".."));
  const profile = options.profile ?? "production";
  const dataRoot = join(projectRoot, "data");
  const files = jsonFiles(dataRoot);
  const questions: PlayableQuestion[] = [];
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
      issues.push({ file, code: "JSON_PARSE", message: `JSON 파싱 실패: ${(error as Error).message}` });
      continue;
    }
    if (!Array.isArray(content)) {
      issues.push({ file, code: "INVALID_FILE_ROOT", message: "최상위 값은 배열이어야 합니다." });
      continue;
    }

    content.forEach((raw, index) => {
      const result = questionSchema.safeParse(raw);
      if (!result.success) {
        for (const issue of result.error.issues) {
          issues.push({ file, index, questionId: typeof (raw as { id?: unknown })?.id === "string" ? (raw as { id: string }).id : undefined, path: issue.path.join(".") || "question", code: issue.code.toUpperCase(), message: issue.message });
        }
        return;
      }
      const question = result.data as PlayableQuestion;
      questions.push(question);

      const existingId = ids.get(question.id);
      if (existingId) issues.push({ file, index, questionId: question.id, code: "DUPLICATE_ID", message: `중복 ID ${question.id} (기존: ${existingId})` });
      else ids.set(question.id, file);

      if (question.answer) {
        const acceptedAnswers = new Set((question.acceptedAnswers ?? []).map(normalize));
        if (!acceptedAnswers.has(normalize(question.answer))) {
          issues.push({ file, index, questionId: question.id, path: "acceptedAnswers", code: "ANSWER_NOT_ACCEPTED", message: "acceptedAnswers에 기본 answer가 포함되어야 합니다." });
        }
      }

      const accepted = question.acceptedAnswers ?? [];
      if (new Set(accepted.map(normalize)).size !== accepted.length) {
        issues.push({ file, index, questionId: question.id, path: "acceptedAnswers", code: "DUPLICATE_ANSWER", message: "acceptedAnswers에 정규화 후 중복되는 값이 있습니다." });
      }

      const metadata = question.metadata as Record<string, unknown> | undefined;
      const prompt = typeof metadata?.prompt === "string" ? metadata.prompt : "";
      const fingerprintValue = question.gameType === "four_syllable"
        ? question.metadata.fullAnswer
        : question.answer ?? prompt;
      const fingerprint = `${question.gameType}:${normalize(fingerprintValue)}`;
      const existingFingerprint = fingerprints.get(fingerprint);
      if (existingFingerprint) issues.push({ file, index, questionId: question.id, code: "DUPLICATE_CONTENT", message: `동일 게임 내 중복 후보 (기존: ${existingFingerprint})` });
      else fingerprints.set(fingerprint, `${file}[${index}]`);

      if (question.asset) {
        const assetPath = join(projectRoot, "public", question.asset.replace(/^\//, ""));
        if (!existsSync(assetPath)) issues.push({ file, index, questionId: question.id, path: "asset", code: "MISSING_ASSET", message: `에셋 파일 없음: ${question.asset}` });
      }

      if (question.gameType === "four_syllable") {
        const compactPrompt = question.metadata.prompt.replace(/\s/g, "");
        const compactAnswer = question.answer.replace(/\s/g, "");
        if (`${question.metadata.prompt}${question.answer}` !== question.metadata.fullAnswer) issues.push({ file, index, questionId: question.id, path: "metadata.fullAnswer", code: "INVALID_FULL_ANSWER", message: "prompt + answer가 fullAnswer와 일치하지 않습니다." });
        if ([...compactPrompt].length !== 2 || [...compactAnswer].length !== 2) issues.push({ file, index, questionId: question.id, path: "metadata.prompt", code: "INVALID_SYLLABLE_COUNT", message: "prompt와 answer는 각각 2음절이어야 합니다." });
        const existingPrompt = fourSyllablePrompts.get(normalize(compactPrompt));
        if (existingPrompt) issues.push({ file, index, questionId: question.id, path: "metadata.prompt", code: "DUPLICATE_PROMPT", message: `동일 앞말 중복 (기존: ${existingPrompt})` });
        else fourSyllablePrompts.set(normalize(compactPrompt), `${file}[${index}]`);
      }

      if (question.gameType === "three_in_time") {
        if (new Set(question.metadata.examples.map(normalize)).size !== question.metadata.examples.length) issues.push({ file, index, questionId: question.id, path: "metadata.examples", code: "DUPLICATE_EXAMPLE", message: "판정 예시에 중복이 있습니다." });
      }

      if (question.gameType === "football_career") {
        question.metadata.career.forEach((entry, careerIndex) => {
          if (entry.order !== careerIndex + 1) issues.push({ file, index, questionId: question.id, path: `metadata.career.${careerIndex}.order`, code: "INVALID_CAREER_ORDER", message: "career order는 1부터 순차 증가해야 합니다." });
        });
        if (!question.sources?.length) issues.push({ file, index, questionId: question.id, path: "sources", code: "MISSING_SOURCE", message: "선수 커리어에는 검증 출처가 필요합니다." });
      }
    });
  }

  if (profile === "production") {
    for (const gameType of MVP_GAME_TYPES) {
      const gameQuestions = questions.filter((question) => question.gameType === gameType);
      if (gameQuestions.length < 100) issues.push({ file: "data", code: "CONTENT_REQUIREMENT", message: `${gameType}: 최소 100문항이어야 합니다. (현재 ${gameQuestions.length})` });
      if (gameQuestions.some((question) => !question.enabled || !question.verified)) issues.push({ file: "data", code: "CONTENT_REQUIREMENT", message: `${gameType}: 모든 문항이 활성·검증 상태여야 합니다.` });
      const boundaries = [0, 0.2, 0.45, 0.75, 0.95, 1].map((ratio) => Math.floor(gameQuestions.length * ratio));
      const expectedDifficulty = boundaries.slice(0, 5).map((start, index) => boundaries[index + 1] - start);
      expectedDifficulty.forEach((expected, difficultyIndex) => {
        const actual = gameQuestions.filter((question) => question.difficulty === difficultyIndex + 1).length;
        if (actual !== expected) issues.push({ file: "data", code: "CONTENT_REQUIREMENT", message: `${gameType}: 난이도 ${difficultyIndex + 1}은 ${expected}문항이어야 합니다. (현재 ${actual})` });
      });
    }
    for (const gameType of ["music_intro", "logo_quiz", "movie_poster", "song_drawing"] as const) {
      if (!questions.some((question) => question.gameType === gameType && question.enabled && question.verified)) {
        issues.push({ file: "data", code: "CONTENT_REQUIREMENT", message: `${gameType}: 활성·검수 문항이 최소 1개 필요합니다.` });
      }
    }
  }

  const people = questions.filter((question): question is Extract<MvpQuestion, { gameType: "person_quiz" }> => question.gameType === "person_quiz");
  if (people.some((question) => !question.asset || !question.attribution || !question.sources?.length)) issues.push({ file: "data", code: "MISSING_PERSON_CREDIT", message: "모든 인물 문항에는 로컬 이미지·라이선스·출처가 필요합니다." });

  for (const question of questions) {
    if (!question.asset) continue;
    const assetPath = join(projectRoot, "public", question.asset.replace(/^\//, ""));
    if (!existsSync(assetPath)) continue;
    const extension = extname(assetPath).toLowerCase();
    try {
      if ([".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(extension)) {
        const metadata = await sharp(assetPath).metadata();
        if (!metadata.width || !metadata.height) throw new Error("이미지 크기를 읽을 수 없습니다.");
        if (question.gameType === "movie_poster") {
          const declared = question.metadata.posterAspectRatio.width / question.metadata.posterAspectRatio.height;
          const actual = metadata.width / metadata.height;
          if (Math.abs(actual - declared) / declared > 0.02) {
            issues.push({ file: question.id, questionId: question.id, path: "metadata.posterAspectRatio", code: "ASPECT_RATIO_MISMATCH", message: `선언 비율 ${declared.toFixed(3)}과 실제 비율 ${actual.toFixed(3)}이 다릅니다.` });
          }
        }
      } else if ([".wav", ".mp3", ".m4a", ".ogg"].includes(extension)) {
        const metadata = await parseFile(assetPath);
        if (!metadata.format.duration || metadata.format.duration <= 0) throw new Error("오디오 길이를 읽을 수 없습니다.");
        if (question.gameType === "music_intro") {
          const required = question.metadata.clipStartSec + Math.max(...question.metadata.clipDurationsSec);
          if (required > metadata.format.duration + 0.05) {
            issues.push({ file: question.id, questionId: question.id, path: "metadata.clipDurationsSec", code: "AUDIO_CLIP_OUT_OF_RANGE", message: `필요 길이 ${required.toFixed(2)}초가 실제 ${metadata.format.duration.toFixed(2)}초를 넘습니다.` });
          }
        }
      } else {
        issues.push({ file: question.id, questionId: question.id, path: "asset", code: "UNSUPPORTED_ASSET", message: `지원하지 않는 에셋 형식입니다: ${extension || "확장자 없음"}` });
      }
    } catch (error) {
      issues.push({ file: question.id, questionId: question.id, path: "asset", code: "INVALID_ASSET", message: `에셋을 읽을 수 없습니다: ${(error as Error).message}` });
    }
  }

  if (options.verifyManifest !== false) {
    try {
      const actual = buildContentManifest(projectRoot, files, questions);
      const expected = readContentManifest(projectRoot);
      manifestDifferences(projectRoot, actual, expected).forEach((message) => issues.push({ file: "data/content-manifest.json", code: "MANIFEST_MISMATCH", message }));
    } catch (error) {
      issues.push({ file: "data/content-manifest.json", code: "MANIFEST_INVALID", message: `manifest를 읽을 수 없습니다: ${(error as Error).message}` });
    }
  }

  return { questions, issues, files };
}
