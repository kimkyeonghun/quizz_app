import { scanData } from "./data-utils";
import type { PlayableQuestion } from "../src/domain/types";
import type { ValidationProfile } from "../src/data/contentTypes";
import { resolve } from "node:path";

const profile = (process.argv.find((argument) => argument.startsWith("--profile="))?.slice("--profile=".length) ?? "production") as ValidationProfile;
const root = resolve(process.argv.find((argument) => argument.startsWith("--root="))?.slice("--root=".length) ?? ".");
const result = await scanData({ root, profile });
const byGame = result.questions.reduce<Record<string, PlayableQuestion[]>>((groups, question) => {
  (groups[question.gameType] ??= []).push(question);
  return groups;
}, {});

console.log("Party Quiz 데이터 현황");
console.log("=======================");
for (const [gameType, gameQuestions] of Object.entries(byGame)) {
  const questions = gameQuestions ?? [];
  const enabled = questions.filter((question) => question.enabled).length;
  const verified = questions.filter((question) => question.verified).length;
  const difficulties = [1, 2, 3, 4, 5].map((level) => questions.filter((question) => question.difficulty === level).length).join("/");
  const categories = new Set(questions.map((question) => question.category)).size;
  const privateOnly = questions.filter((question) => "usageScope" in question && question.usageScope === "private_only").length;
  console.log(`${gameType.padEnd(22)} 전체 ${String(questions.length).padStart(3)} | 활성 ${String(enabled).padStart(3)} | 검증 ${String(verified).padStart(3)} | 로컬 ${String(privateOnly).padStart(2)} | 난이도 ${difficulties} | 분류 ${categories}`);
}
console.log("-----------------------");
console.log(`총 문제 ${result.questions.length}, 검증 오류 ${result.issues.length}`);
if (result.issues.length) process.exitCode = 1;
