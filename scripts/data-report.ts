import { scanData } from "./data-utils";
import type { MvpQuestion } from "../src/domain/types";

const result = scanData();
const byGame = result.questions.reduce<Record<string, MvpQuestion[]>>((groups, question) => {
  (groups[question.gameType] ??= []).push(question);
  return groups;
}, {});

console.log("Party Quiz 데이터 현황");
console.log("=======================");
for (const [gameType, gameQuestions] of Object.entries(byGame)) {
  const questions = gameQuestions ?? [];
  const enabled = questions.filter((question) => question.enabled).length;
  const verified = questions.filter((question) => question.verified).length;
  console.log(`${gameType.padEnd(22)} 전체 ${String(questions.length).padStart(3)} | 활성 ${String(enabled).padStart(3)} | 검증 ${String(verified).padStart(3)}`);
}
console.log("-----------------------");
console.log(`총 문제 ${result.questions.length}, 검증 오류 ${result.issues.length}`);
if (result.issues.length) process.exitCode = 1;
