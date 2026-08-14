import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import type { MvpQuestion } from "../src/domain/types";
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

      if (question.gameType === "four_syllable" && `${question.metadata.prompt}${question.answer}` !== question.metadata.fullAnswer) {
        issues.push({ file, index, message: "prompt + answer가 fullAnswer와 일치하지 않습니다." });
      }

      if (question.gameType === "football_career") {
        question.metadata.career.forEach((entry, careerIndex) => {
          if (entry.order !== careerIndex + 1) issues.push({ file, index, message: "career order는 1부터 순차 증가해야 합니다." });
        });
        const maxIndex = question.metadata.career.length - 1;
        question.metadata.revealStages.flat().forEach((stageIndex) => {
          if (stageIndex > maxIndex) issues.push({ file, index, message: `잘못된 reveal stage index: ${stageIndex}` });
        });
      }
    });
  }

  return { questions, issues, files };
}
